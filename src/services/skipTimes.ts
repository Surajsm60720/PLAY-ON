


const ANI_SKIP_API = 'https://api.aniskip.com/v2/skip-times';

export interface SkipTime {
    interval: {
        startTime: number;
        endTime: number;
    };
    skipType: 'op' | 'ed'; // 'op' = Intro, 'ed' = Outro
    skipId: string;
    episodeLength: number;
}

interface SkipResponse {
    found: boolean;
    results: SkipTime[];
    message: string;
    statusCode: number;
}

/**
 * Fetches skip times (Intro/Outro) for a given MyAnimeList ID and episode number.
 */
export async function getSkipTimes(malId: number, episodeNumber: number): Promise<SkipTime[]> {
    try {
        const url = `${ANI_SKIP_API}/${malId}/${episodeNumber}?types=op&types=ed&episodeLength=0`;

        // We use the same 'stream_proxy' command or fetch directly if CORS allows.
        // Assuming stream_proxy is safe or using tauri-plugin-http is better.
        // Since we have a proxy set up for streams, let's try a standard fetch first.
        // If CORS blocks it, we can fallback to the Rust proxy.
        // Actually, for a simple JSON API, standard fetch might be blocked by CORS in a WebView if the API doesn't allow it.
        // ani-skip usually allows CORS.

        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`[SkipTimes] Failed to fetch: ${response.statusText}`);
            return [];
        }

        const data: SkipResponse = await response.json();

        if (data.found && data.results) {
            return data.results;
        }

        return [];

    } catch (err) {
        console.error('[SkipTimes] Error fetching skip times:', err);
        return [];
    }
}
