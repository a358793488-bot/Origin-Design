import type { ImageModelRules, ModelConfig } from "../types";
import { generateAgnesImage } from "./agnes";
import { calculateImageSize } from "./rules";

const BASE_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];

export const AgnesImageHandler = {
    rules: { resolutions: ['1k'], ratios: BASE_RATIOS },
    generate: async (cfg: ModelConfig, prompt: string, params: any) => {
        return await generateAgnesImage(cfg, prompt, params.aspectRatio, params.inputImages, params.count);
    }
};

export const AgnesImageEditHandler = {
    rules: { resolutions: ['1k'], ratios: BASE_RATIOS, supportsEdit: true },
    generate: async (cfg: ModelConfig, prompt: string, params: any) => {
        return await generateAgnesImage(cfg, prompt, params.aspectRatio, params.inputImages, params.count);
    }
};

export const IMAGE_HANDLERS: Record<string, any> = {
    'Agnes Image': AgnesImageHandler,
    'Agnes Image Edit': AgnesImageEditHandler,
};
