import { MODEL_REGISTRY, getModelConfig, saveModelConfig, registerCustomModel, deleteModel, isCustomModel, getVisibleModels } from "./mode/config";
import type { ModelConfig } from "./mode/config";
import { IMAGE_HANDLERS, AgnesImageHandler } from "./mode/image/configurations";
import { VIDEO_HANDLERS, AgnesVideoHandler } from "./mode/video/configurations";
import { constructUrl, fetchThirdParty } from "./mode/network";

export { MODEL_REGISTRY, getModelConfig, saveModelConfig, registerCustomModel, deleteModel, isCustomModel, getVisibleModels };
export type { ModelConfig };

export const generateCreativeDescription = async (input: string, mode: 'IMAGE' | 'VIDEO'): Promise<string> => {
  const config = getModelConfig('Agnes Image');
  if (!config.key) return input;
  const prompt = `Optimize this ${mode.toLowerCase()} description for professional AI generation. Input: "${input}". Provide ONLY the optimized prompt text.`;
  try {
     const payload = { model: 'agnes-2.0-flash', messages: [{ role: 'user', content: prompt }] };
     const url = constructUrl(config.baseUrl, '/v1/chat/completions');
     const res = await fetchThirdParty(url, 'POST', payload, config);
     return res.choices?.[0]?.message?.content || input;
  } catch (e) {
    return input;
  }
};

export const generateImage = async (
    prompt: string,
    aspectRatio: string = "1:1",
    modelName: string = "Agnes Image",
    resolution: string = "1k",
    count: number = 1,
    inputImages: string[] = [],
    promptOptimize: boolean = false
): Promise<string[]> => {
  let handler = IMAGE_HANDLERS[modelName];

  if (!handler) {
      const def = MODEL_REGISTRY[modelName];
      if (def) {
          handler = AgnesImageHandler;
      }
  }

  if (!handler) handler = IMAGE_HANDLERS['Agnes Image'];

  const config = getModelConfig(modelName);

  try {
      const result = await handler.generate(config, prompt, { aspectRatio, resolution, inputImages, count, promptOptimize });
      return Array.isArray(result) ? result : [result];
  } catch (e) {
    console.error(`Error generating image with ${modelName}`, e);
    throw e;
  }
};

export const generateVideo = async (
    prompt: string,
    inputImages: string[] = [],
    aspectRatio: string = "16:9",
    modelName: string = "Agnes Video",
    resolution: string = "768p",
    duration: string = "5s",
    count: number = 1,
    promptOptimize: boolean = false
): Promise<string[]> => {
    let realModelName = modelName;
    const isStartEndMode = modelName.endsWith('_FL');
    if (isStartEndMode) realModelName = modelName.replace('_FL', '');

    let handler = VIDEO_HANDLERS[realModelName];

    if (!handler) {
        const def = MODEL_REGISTRY[realModelName];
        if (def) {
            handler = AgnesVideoHandler;
        }
    }

    if (!handler) handler = VIDEO_HANDLERS['Agnes Video'];

    const config = getModelConfig(realModelName);

    try {
        const result = await handler.generate(config, prompt, {
            aspectRatio, resolution, duration, inputImages, isStartEndMode, count, promptOptimize
        });
        return Array.isArray(result) ? result : [result];
    } catch (e) {
        console.error(`Error generating video with ${modelName}`, e);
        throw e;
    }
};
