/**
 * Streaming Service - Anime streaming abstraction using Consumet API
 * 
 * This service provides a unified interface to fetch anime streaming sources
 * from various providers like Hianime, AnimePahe, etc.
 */

import { ANIME, META } from '@consumet/extensions';

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

export interface StreamingServer {
    name: string;
    url: string;
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

export type ProviderType = 'hianime' | 'animepahe' | 'animekai' | 'anilist';

// Provider instances (lazy initialized)
const getProvider = (provider: ProviderType) => {
    switch (provider) {
        case 'hianime':
            return new ANIME.Hianime();
        case 'animepahe':
            return new ANIME.AnimePahe();
        case 'animekai':
            return new ANIME.AnimeKai();
        case 'anilist':
            return new META.Anilist();
        default:
            return new ANIME.Hianime();
    }
};

/**
 * Search for anime by title
 */
export async function searchAnime(
    query: string,
    provider: ProviderType = 'hianime'
): Promise<AnimeSearchResult[]> {
    try {
        const providerInstance = getProvider(provider);
        const results = await providerInstance.search(query);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return results.results.map((result: any) => ({
            id: result.id,
            title: typeof result.title === 'string' ? result.title : (result.title?.romaji || result.title?.english || 'Unknown'),
            image: result.image,
            releaseDate: result.releaseDate,
            subOrDub: result.subOrDub,
        }));
    } catch (error) {
        console.error('[StreamingService] Search failed:', error);
        throw error;
    }
}

/**
 * Get anime info including episode list
 */
export async function getAnimeInfo(
    animeId: string,
    provider: ProviderType = 'hianime'
): Promise<AnimeInfo> {
    try {
        const providerInstance = getProvider(provider);
        const info = await providerInstance.fetchAnimeInfo(animeId);

        return {
            id: info.id,
            title: typeof info.title === 'string' ? info.title : (info.title?.romaji || info.title?.english || 'Unknown'),
            image: info.image,
            description: info.description,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            episodes: (info.episodes || []).map((ep: any) => ({
                id: ep.id,
                number: ep.number,
                title: ep.title,
                url: ep.url,
                image: ep.image,
            })),
            totalEpisodes: info.totalEpisodes,
            status: info.status,
            releaseDate: info.releaseDate,
        };
    } catch (error) {
        console.error('[StreamingService] GetAnimeInfo failed:', error);
        throw error;
    }
}

/**
 * Get streaming sources for an episode
 */
export async function getEpisodeSources(
    episodeId: string,
    provider: ProviderType = 'hianime',
    _server?: string
): Promise<EpisodeSources> {
    try {
        const providerInstance = getProvider(provider);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sources = await (providerInstance as any).fetchEpisodeSources(episodeId);

        return {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sources: (sources.sources || []).map((src: any) => ({
                url: src.url,
                quality: src.quality || 'default',
                isM3U8: src.isM3U8 ?? src.url?.includes('.m3u8'),
            })),
            subtitles: sources.subtitles,
            headers: sources.headers,
        };
    } catch (error) {
        console.error('[StreamingService] GetEpisodeSources failed:', error);
        throw error;
    }
}

/**
 * Get available servers for an episode
 */
export async function getEpisodeServers(
    episodeId: string,
    provider: ProviderType = 'hianime'
): Promise<StreamingServer[]> {
    try {
        const providerInstance = getProvider(provider);

        // Not all providers support this
        if ('fetchEpisodeServers' in providerInstance) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const servers = await (providerInstance as any).fetchEpisodeServers(episodeId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return servers.map((server: any) => ({
                name: server.name,
                url: server.url,
            }));
        }

        return [];
    } catch (error) {
        console.error('[StreamingService] GetEpisodeServers failed:', error);
        return [];
    }
}

/**
 * Get list of available providers
 */
export function getAvailableProviders(): { id: ProviderType; name: string }[] {
    return [
        { id: 'hianime', name: 'Hianime' },
        { id: 'animepahe', name: 'AnimePahe' },
        { id: 'animekai', name: 'AnimeKai' },
        { id: 'anilist', name: 'Anilist (Meta)' },
    ];
}

export default {
    searchAnime,
    getAnimeInfo,
    getEpisodeSources,
    getEpisodeServers,
    getAvailableProviders,
};
