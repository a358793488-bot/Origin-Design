import type { VideoModelRules, ModelConfig } from "../types";
import { generateAgnesVideo } from "./agnes";

const BASE_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'];

export const AgnesVideoHandler = {
    rules: { resolutions: ['768p', '1080p'], durations: ['5s', '10s'], ratios: BASE_RATIOS, maxInputImages: 1 },
    generate: async (cfg: ModelConfig, prompt: string, params: any) => {
        return [await generateAgnesVideo(cfg, prompt, params.aspectRatio, params.inputImages)];
    }
};

export const VIDEO_HANDLERS: Record<string, any> = {
    'Agnes Video': AgnesVideoHandler,
};
