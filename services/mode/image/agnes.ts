import type { ModelConfig } from "../types";
import { fetchThirdParty, constructUrl } from "../network";

export const generateAgnesImage = async (
    config: ModelConfig,
    prompt: string,
    aspectRatio: string,
    inputImages: string[],
    n: number,
): Promise<string[]> => {
    const targetUrl = constructUrl(config.baseUrl, config.endpoint);

    const sizeMap: Record<string, string> = {
        '1:1': '1024x1024',
        '3:4': '768x1024',
        '4:3': '1024x768',
        '9:16': '576x1024',
        '16:9': '1024x576',
    };
    const size = sizeMap[aspectRatio] || '1024x1024';

    const payload: any = { model: config.modelId, prompt, n, size };

    if (inputImages.length > 0) {
        payload.image = inputImages[0];
    }

    const res = await fetchThirdParty(targetUrl, 'POST', payload, config, { timeout: 200000 });
    const data = (res.data && Array.isArray(res.data)) ? res.data : (res.data ? [res.data] : [res]);

    return data.map((item: any) => {
        if (item.url) return item.url;
        if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
        return '';
    }).filter((url: string) => !!url);
};
