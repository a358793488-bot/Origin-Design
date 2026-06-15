import type { ModelConfig } from "../types";
import { fetchThirdParty, constructUrl } from "../network";

export const generateAgnesVideo = async (
    config: ModelConfig,
    prompt: string,
    aspectRatio: string,
    inputImages: string[],
): Promise<string> => {
    const targetUrl = constructUrl(config.baseUrl, config.endpoint);

    const dimMap: Record<string, { width: number; height: number }> = {
        '16:9': { width: 1152, height: 768 },
        '9:16': { width: 768, height: 1152 },
        '1:1': { width: 768, height: 768 },
        '4:3': { width: 1024, height: 768 },
        '3:4': { width: 768, height: 1024 },
    };
    const dims = dimMap[aspectRatio] || { width: 1152, height: 768 };

    const payload: any = {
        model: config.modelId,
        prompt,
        width: dims.width,
        height: dims.height,
    };

    if (inputImages.length > 0) {
        payload.image = inputImages[0];
    }

    const res = await fetchThirdParty(targetUrl, 'POST', payload, config, { timeout: 120000 });

    const videoId = res.video_id || res.id || res.data?.video_id;
    if (!videoId) throw new Error(`No video_id returned: ${JSON.stringify(res)}`);

    const baseUrl = config.baseUrl.replace(/\/v1\/?$/, '');
    const qUrl = `${baseUrl}/agnesapi?video_id=${encodeURIComponent(videoId)}`;

    let attempts = 0;
    while (attempts < 180) {
        await new Promise(r => setTimeout(r, 3000));
        try {
            const check = await fetchThirdParty(qUrl, 'GET', null, config, { timeout: 10000 });

            const status = (check.status || '').toString().toLowerCase();

            if (['completed', 'succeeded', 'success'].includes(status)) {
                if (check.video_url) return check.video_url;
                if (check.url) return check.url;
                if (check.remixed_from_video_id) return check.remixed_from_video_id;
                if (check.data?.video_url) return check.data.video_url;
                if (check.data?.url) return check.data.url;
                if (check.output?.video_url) return check.output.video_url;
                if (check.output?.url) return check.output.url;
                throw new Error("Video completed but no URL found");
            } else if (['failed', 'failure', 'error'].includes(status)) {
                throw new Error(`Video failed: ${check.fail_reason || check.error || 'Unknown'}`);
            }
        } catch (e: any) {
            if (attempts > 170) throw e;
        }
        attempts++;
    }
    throw new Error("Video generation timed out");
};
