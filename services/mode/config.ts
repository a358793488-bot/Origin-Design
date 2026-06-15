
import { EnvConfig } from "../env";
import type { ModelDef, ModelConfig } from "./types";

export type { ModelConfig };

const CUSTOM_MODELS_KEY = 'CUSTOM_MODEL_REGISTRY';
const DELETED_MODELS_KEY = 'DELETED_MODELS';

const loadCustomModels = (): Record<string, ModelDef> => {
    if (typeof window === 'undefined') return {};
    try {
        const stored = localStorage.getItem(CUSTOM_MODELS_KEY);
        return stored ? JSON.parse(stored) : {};
    } catch(e) { return {}; }
};

// 加载已删除的模型列表
const loadDeletedModels = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
        const stored = localStorage.getItem(DELETED_MODELS_KEY);
        return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch(e) { return new Set(); }
};

const customModels = loadCustomModels();
const deletedModels = loadDeletedModels();

export const MODEL_REGISTRY: Record<string, ModelDef> = {
  'Agnes Image': { id: 'agnes-image-2.1-flash', name: 'Agnes Image', type: 'IMAGE_GEN', category: 'IMAGE', defaultEndpoint: '/v1/images/generations' },
  'Agnes Image Edit': { id: 'agnes-image-2.0-flash', name: 'Agnes Image Edit', type: 'IMAGE_GEN', category: 'IMAGE', defaultEndpoint: '/v1/images/generations' },
  'Agnes Video': { id: 'agnes-video-v2.0', name: 'Agnes Video', type: 'VIDEO_GEN_STD', category: 'VIDEO', defaultEndpoint: '/v1/videos', defaultQueryEndpoint: '/v1/videos' },
  
  ...customModels
};

// 启动时删除已标记删除的模型
deletedModels.forEach(key => {
    delete MODEL_REGISTRY[key];
});

const getStorageKey = (modelName: string) => `API_CONFIG_MODEL_${modelName}`;

// 全局配置 Key（与 SettingsModal 保持一致）
const GLOBAL_BASE_URL_KEY = 'GLOBAL_BASE_URL';
const GLOBAL_API_KEY_KEY = 'GLOBAL_API_KEY';

// 获取全局配置
const getGlobalConfig = (): { baseUrl: string; key: string } => {
    if (typeof window === 'undefined') {
        return { baseUrl: '', key: '' };
    }
    return {
        baseUrl: localStorage.getItem(GLOBAL_BASE_URL_KEY) || '',
        key: localStorage.getItem(GLOBAL_API_KEY_KEY) || ''
    };
};

export const getModelConfig = (modelName: string): ModelConfig => {
    const def = MODEL_REGISTRY[modelName];
    const globalConfig = getGlobalConfig();
    
    if (!def) {
        return {
            baseUrl: globalConfig.baseUrl || EnvConfig.DEFAULT_BASE_URL,
            key: globalConfig.key, 
            modelId: '',
            endpoint: '/v1/chat/completions'
        };
    }

    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(getStorageKey(modelName));
        if (stored) {
            const parsed = JSON.parse(stored);
            
            // 自动更新过时的 endpoint
            let endpoint = parsed.endpoint;
            let queryEndpoint = parsed.queryEndpoint;
            let downloadEndpoint = parsed.downloadEndpoint;
            
            // 如果当前 endpoint 是旧的 chat completions，更新为新的 video create
            if (endpoint === '/v1/chat/completions' && def.type === 'VIDEO_GEN_STD') {
                endpoint = def.defaultEndpoint;
                queryEndpoint = def.defaultQueryEndpoint || '';
                downloadEndpoint = def.defaultDownloadEndpoint || '';
                
                // 保存更新后的配置
                saveModelConfig(modelName, {
                    ...parsed,
                    endpoint,
                    queryEndpoint,
                    downloadEndpoint
                });
            }
            
            return {
                // 模型特定配置优先，否则使用全局配置
                baseUrl: parsed.baseUrl || globalConfig.baseUrl || EnvConfig.DEFAULT_BASE_URL,
                key: parsed.key || globalConfig.key || '', 
                modelId: parsed.modelId || def.id,
                endpoint: endpoint || def.defaultEndpoint,
                queryEndpoint: queryEndpoint || def.defaultQueryEndpoint || '',
                downloadEndpoint: downloadEndpoint || def.defaultDownloadEndpoint || ''
            };
        }
    }

    // 没有模型特定配置时，使用全局配置
    return {
        baseUrl: globalConfig.baseUrl || EnvConfig.DEFAULT_BASE_URL,
        key: globalConfig.key || '', 
        modelId: def.id,
        endpoint: def.defaultEndpoint,
        queryEndpoint: def.defaultQueryEndpoint || '',
        downloadEndpoint: def.defaultDownloadEndpoint || ''
    };
};

export const saveModelConfig = (modelName: string, config: ModelConfig) => {
    localStorage.setItem(getStorageKey(modelName), JSON.stringify(config));
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('modelConfigUpdated', { detail: { modelName } }));
    }
};

export const registerCustomModel = (key: string, def: ModelDef) => {
    MODEL_REGISTRY[key] = def;
    const current = loadCustomModels();
    current[key] = def;
    localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(current));
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('modelRegistryUpdated'));
    }
};

// 删除模型（任意模型都可删除）
export const deleteModel = (key: string): boolean => {
    if (!MODEL_REGISTRY[key]) return false;
    
    // 从 MODEL_REGISTRY 中删除
    delete MODEL_REGISTRY[key];
    
    // 如果是自定义模型，从自定义模型存储中删除
    const customModels = loadCustomModels();
    if (customModels[key]) {
        delete customModels[key];
        localStorage.setItem(CUSTOM_MODELS_KEY, JSON.stringify(customModels));
    }
    
    // 记录已删除的内置模型
    const deleted = loadDeletedModels();
    deleted.add(key);
    localStorage.setItem(DELETED_MODELS_KEY, JSON.stringify([...deleted]));
    deletedModels.add(key);
    
    // 删除该模型的配置
    localStorage.removeItem(`API_CONFIG_MODEL_${key}`);
    
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('modelRegistryUpdated'));
    }
    return true;
};

// 检查是否是自定义模型
export const isCustomModel = (key: string): boolean => {
    const customModels = loadCustomModels();
    return !!customModels[key];
};

// 获取可见的模型列表（用于下拉框）
export const getVisibleModels = (): string[] => {
    return Object.keys(MODEL_REGISTRY);
};
