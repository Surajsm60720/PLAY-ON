/**
 * Streaming Service - Uses Consumet API + Tauri HTTP Proxy
 * 
 * This service uses:
 * - Consumet API (consumet-api-three.vercel.app) for anime search
 * - AniList API for detailed anime info
 * - Tauri HTTP proxy for CORS bypass
 * 
 * Note: Most public anime streaming APIs are deprecated or rate-limited.
 * Episode sources may require self-hosting Consumet or using local files.
 */

import { invoke } from '@tauri-apps/api/core';

// Types
export interface StreamingEpisode {
    id: string;
    number: number;
    title?: string;
    url?: string;
    image?: string;
}

export interface StreamingSource {
    url: string;
    quality: string;
    isM3U8: boolean;
}

export interface AnimeSearchResult {
    id: string;
    title: string;
    image?: string;
    releaseDate?: string;
    subOrDub?: string;
}

export interface AnimeInfo {
    id: string;
    title: string;
    image?: string;
    description?: string;
    episodes: StreamingEpisode[];
    totalEpisodes?: number;
    status?: string;
    releaseDate?: string;
}

export interface EpisodeSources {
    sources: StreamingSource[];
    subtitles?: Array<{ url: string; lang: string }>;
    headers?: Record<string, string>;
}

export type ProviderType = 'hianime' | 'zoro' | 'gogoanime' | 'anilist';

// Consumet API base URL (public self-hosted instance)
const CONSUMET_API = 'https://consumet-api-three.vercel.app';

// Use Tauri HTTP proxy to make requests
async function proxyFetch(url: string, options: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
} = {}): Promise<{ status: number; body: string; headers: Record<string, string> }> {
    try {
        console.log('[StreamingService] Proxy fetch:', url);
        const result = await invoke('http_proxy_command', {
            url,
            method: options.method || 'GET',
            headers: options.headers || null,
            body: options.body || null,
        });

        const parsed = JSON.parse(result as string);
        console.log('[StreamingService] Response status:', parsed.status);
        return parsed;
    } catch (error) {
        console.error('[StreamingService] Proxy fetch failed:', error);
        throw error;
    }
}

/**
 * Search for anime using Consumet/AniList meta provider
 */
export async function searchAnime(
    query: string,
    _provider: ProviderType = 'anilist'
): Promise<AnimeSearchResult[]> {
    try {
        console.log(`[StreamingService] Searching for "${query}"`);

        const response = await proxyFetch(
            `${CONSUMET_API}/meta/anilist/${encodeURIComponent(query)}`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );

        if (response.status !== 200) {
            throw new Error(`Consumet API returned ${response.status}`);
        }

        const data = JSON.parse(response.body);
        const results = data.results || [];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return results.map((anime: any) => ({
            id: anime.id.toString(),
            title: typeof anime.title === 'string'
                ? anime.title
                : (anime.title?.english || anime.title?.romaji || 'Unknown'),
            image: anime.image,
            releaseDate: anime.releaseDate?.toString(),
        }));
    } catch (error) {
        console.error('[StreamingService] Search failed:', error);
        throw error;
    }
}

/**
 * Get anime info with episode list
 */
export async function getAnimeInfo(
    animeId: string,
    provider: ProviderType = 'zoro'
): Promise<AnimeInfo> {
    try {
        console.log(`[StreamingService] Getting info for ${animeId} with provider ${provider}`);

        // Determine which provider to use for episode data
        const providerParam = provider === 'gogoanime' ? 'gogoanime' : 'zoro';

        const response = await proxyFetch(
            `${CONSUMET_API}/meta/anilist/info/${animeId}?provider=${providerParam}`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );

        if (response.status !== 200) {
            // Fallback to AniList-only info
            console.log('[StreamingService] Consumet API failed, falling back to AniList');
            return getAnimeInfoFromAniList(animeId);
        }

        const data = JSON.parse(response.body);

        if (!data || data.error) {
            console.log('[StreamingService] No data returned, falling back to AniList');
            return getAnimeInfoFromAniList(animeId);
        }

        return {
            id: data.id?.toString() || animeId,
            title: typeof data.title === 'string'
                ? data.title
                : (data.title?.english || data.title?.romaji || 'Unknown'),
            image: data.image,
            description: data.description,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            episodes: (data.episodes || []).map((ep: any) => ({
                id: ep.id,
                number: ep.number,
                title: ep.title || `Episode ${ep.number}`,
                image: ep.image,
            })),
            totalEpisodes: data.totalEpisodes,
            status: data.status,
            releaseDate: data.releaseDate?.toString(),
        };
    } catch (error) {
        console.error('[StreamingService] GetAnimeInfo failed:', error);
        // Fallback to AniList
        return getAnimeInfoFromAniList(animeId);
    }
}

/**
 * Fallback: Get anime info from AniList directly
 */
async function getAnimeInfoFromAniList(animeId: string): Promise<AnimeInfo> {
    const graphqlQuery = {
        query: `
            query ($id: Int) {
                Media(id: $id, type: ANIME) {
                    id
                    title { romaji english }
                    description
                    coverImage { large extraLarge }
                    episodes
                    status
                    seasonYear
                    nextAiringEpisode { episode }
                }
            }
        `,
        variables: { id: parseInt(animeId) }
    };

    const response = await proxyFetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify(graphqlQuery),
    });

    const data = JSON.parse(response.body);
    const anime = data.data?.Media;

    if (!anime) {
        throw new Error('Anime not found');
    }

    // Calculate episode count
    let episodeCount = anime.episodes;
    if (!episodeCount && anime.nextAiringEpisode?.episode) {
        episodeCount = anime.nextAiringEpisode.episode - 1;
    }
    if (!episodeCount) episodeCount = 12;

    // Generate episode list (without streaming IDs)
    const episodes: StreamingEpisode[] = [];
    const slug = (anime.title?.english || anime.title?.romaji || 'anime')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-');

    for (let i = 1; i <= episodeCount; i++) {
        episodes.push({
            id: `${slug}$episode$${i}`,
            number: i,
            title: `Episode ${i}`,
        });
    }

    return {
        id: anime.id.toString(),
        title: anime.title?.english || anime.title?.romaji || 'Unknown',
        image: anime.coverImage?.extraLarge || anime.coverImage?.large,
        description: anime.description,
        episodes,
        totalEpisodes: anime.episodes,
        status: anime.status,
        releaseDate: anime.seasonYear?.toString(),
    };
}

/**
 * Get streaming sources for an episode
 */
export async function getEpisodeSources(
    episodeId: string,
    _provider: ProviderType = 'zoro'
): Promise<EpisodeSources> {
    try {
        console.log(`[StreamingService] Getting sources for ${episodeId}`);

        // Check if this is a real episode ID (from Consumet) or a generated one
        if (episodeId.includes('$episode$')) {
            throw new Error(
                'No streaming sources available. ' +
                'Try selecting a different provider or use local files.'
            );
        }

        // Try to get sources from Consumet API
        const response = await proxyFetch(
            `${CONSUMET_API}/meta/anilist/watch/${encodeURIComponent(episodeId)}`,
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );

        if (response.status !== 200) {
            throw new Error(`Failed to fetch sources: HTTP ${response.status}`);
        }

        const data = JSON.parse(response.body);

        if (!data.sources || data.sources.length === 0) {
            throw new Error('No streaming sources found for this episode.');
        }

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sources: (data.sources || []).map((src: any) => ({
                url: src.url,
                quality: src.quality || 'default',
                isM3U8: src.isM3U8 ?? src.url?.includes('.m3u8'),
            })),
            subtitles: data.subtitles,
            headers: data.headers,
        };
    } catch (error) {
        console.error('[StreamingService] GetEpisodeSources failed:', error);
        throw error;
    }
}

/**
 * Get available providers
 */
export function getAvailableProviders(): { id: ProviderType; name: string }[] {
    return [
        { id: 'zoro', name: 'Zoro/HiAnime' },
        { id: 'gogoanime', name: 'Gogoanime' },
        { id: 'anilist', name: 'Anilist (Info Only)' },
    ];
}

export default {
    searchAnime,
    getAnimeInfo,
    getEpisodeSources,
    getAvailableProviders,
};
