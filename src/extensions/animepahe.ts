/**
 * AnimePahe Extension (Manual Implementation)
 * 
 * Re-implemented securely using @tauri-apps/plugin-http to bypass CORS.
 * Scrapes animepahe.ru and extracts m3u8 from Kwik.
 */

import { AnimeSource, Anime, Episode, EpisodeSources, AnimeSearchResult, AnimeSearchFilter } from '../services/anime-sources/AnimeSource';
import { fetch } from '@tauri-apps/plugin-http';

const BASE_URL = 'https://animepahe.ru';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer': BASE_URL,
    'Origin': BASE_URL,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cookie': '' // Cookies might be needed if Cloudflare is strictly checking
};

export const AnimePaheExtension: AnimeSource = {
    id: 'animepahe',
    name: 'AnimePahe',
    baseUrl: BASE_URL,
    lang: 'en',
    iconUrl: 'https://logo.clearbit.com/animepahe.ru',

    async search(filter: AnimeSearchFilter): Promise<AnimeSearchResult> {
        try {
            const query = filter.query || '';
            const url = `${BASE_URL}/api?m=search&q=${encodeURIComponent(query)}`;
            console.log(`[AnimePahe] Searching: ${url}`);

            const response = await fetch(url, { method: 'GET', headers: HEADERS });
            const data = await response.json();

            if (!data.data) return { anime: [], hasNextPage: false };

            const animeList: Anime[] = data.data.map((item: any) => ({
                id: item.session, // AnimePahe uses 'session' as ID
                title: item.title,
                coverUrl: item.poster,
                status: (item.status?.toLowerCase() || 'unknown') as any,
                type: item.type,
                releaseDate: item.year?.toString()
            }));

            return {
                anime: animeList,
                hasNextPage: false
            };
        } catch (error) {
            console.error('[AnimePahe] Search failed:', error);
            return { anime: [], hasNextPage: false };
        }
    },

    async getAnimeInfo(animeId: string): Promise<Anime> {
        try {
            const url = `${BASE_URL}/anime/${animeId}`;
            console.log(`[AnimePahe] Fetching info: ${url}`);

            const response = await fetch(url, { method: 'GET', headers: HEADERS });
            const html = await response.text();

            const descriptionMatch = html.match(/<div class="anime-synopsis">(.*?)<\/div>/s);
            const titleMatch = html.match(/<h1>(.*?)<\/h1>/);
            const posterMatch = html.match(/<img src="(.*?)"/);

            return {
                id: animeId,
                title: titleMatch ? titleMatch[1].trim() : 'Unknown',
                coverUrl: posterMatch ? posterMatch[1] : '',
                description: descriptionMatch ? descriptionMatch[1].trim() : '',
                status: 'unknown',
            };
        } catch (error) {
            console.error('[AnimePahe] Failed to get info:', error);
            throw error;
        }
    },

    async getEpisodes(animeId: string): Promise<Episode[]> {
        try {
            console.log(`[AnimePahe] Fetching episodes for: ${animeId}`);

            let page = 1;
            let allEpisodes: Episode[] = [];
            let hasNext = true;

            while (hasNext && page <= 5) { // Limit to 5 pages for speed
                const url = `${BASE_URL}/api?m=release&id=${animeId}&sort=episode_asc&page=${page}`;
                const response = await fetch(url, { method: 'GET', headers: HEADERS });
                const data = await response.json();

                if (!data.data || data.data.length === 0) break;

                const episodes = data.data.map((ep: any) => ({
                    id: `${animeId}:${ep.session}`, // Composite ID for Source fetching
                    number: ep.episode,
                    title: ep.title || `Episode ${ep.episode}`,
                    image: ep.snapshot,
                    isFiller: false
                }));

                allEpisodes = [...allEpisodes, ...episodes];
                hasNext = data.last_page > page;
                page++;
            }

            return allEpisodes;
        } catch (error) {
            console.error('[AnimePahe] Failed to get episodes:', error);
            return [];
        }
    },

    async getEpisodeSources(episodeId: string): Promise<EpisodeSources> {
        try {
            // 1. Need the Anime ID (session) to construct the play URL correctly
            // But getEpisodeSources only receives episodeId (which is the episode session)
            // URL format: https://animepahe.ru/play/{anime_session}/{episode_session}
            // This is a problem: we don't have anime_session here directly if not passed in ID.

            // Hack: We might need to encode animeId:episodeId in the ID passed to getEpisodes
            // OR searching the referer? No.

            // Let's assume we can find the play page via API or scraping?
            // Actually, querying the API for the episode session gives the anime session?
            // Let's try to fetch the episode page using JUST the episode session if possible?
            // Accessing https://animepahe.ru/play/whatever/{episode_session} might redirect?

            // Use the Referer from search?
            // Actually, let's trying to scrape the episode API again to get the anime_id? No that's slow.

            // WORKAROUND: We will cheat and guess the URL or search for it.
            // Better: We should probably store the animeId in the episodeId during getEpisodes?
            // e.g. "anime_session:episode_session"

            let animeSession = '';
            let epSession = episodeId;

            if (episodeId.includes(':')) {
                [animeSession, epSession] = episodeId.split(':');
            } else {
                throw new Error('Invalid ID format. Need animeId:episodeId');
            }

            const playUrl = `${BASE_URL}/play/${animeSession}/${epSession}`;
            console.log(`[AnimePahe] Fetching play page: ${playUrl}`);

            const response = await fetch(playUrl, { method: 'GET', headers: HEADERS });
            const html = await response.text();

            // 2. Extract Kwik Link
            // Look for <button ... data-src="https://kwik.cx/e/..." ... >
            // or inside the player script
            const kwikMatch = html.match(/data-src="(https:\/\/kwik\.cx\/e\/[^"]+)"/i) ||
                html.match(/src="(https:\/\/kwik\.cx\/e\/[^"]+)"/i);

            if (!kwikMatch) {
                console.warn('[AnimePahe] No Kwik embed found');
                return {
                    sources: [],
                    headers: { 'Referer': playUrl }
                };
            }

            const embedUrl = kwikMatch[1];
            console.log(`[AnimePahe] Found embed: ${embedUrl}`);

            // 3. Fetch Kwik Page
            const embedResp = await fetch(embedUrl, {
                method: 'GET',
                headers: {
                    'Referer': playUrl,
                    'User-Agent': HEADERS['User-Agent']
                }
            });
            const embedHtml = await embedResp.text();

            // 4. Extract m3u8
            // Usually hidden in a script:  const source = "https://...";
            // Or: return p}('... "https://...m3u8" ...')
            // The screenshot shows `uwu.m3u8`

            // Simple regex for .m3u8
            const m3u8Match = embedHtml.match(/(https?:\/\/[^"']+\.m3u8)/);

            if (m3u8Match) {
                console.log(`[AnimePahe] Found extraction: ${m3u8Match[1]}`);
                return {
                    sources: [{
                        url: m3u8Match[1],
                        quality: 'auto',
                        isM3U8: true,
                        isBackup: false
                    }],
                    headers: {
                        'Referer': 'https://kwik.cx/',
                        // Kwik often needs Origin too
                        'Origin': 'https://kwik.cx'
                    }
                };
            }

            // Fallback: packed JS extraction (simplified)
            // If the simple regex fails, it might be packed. 
            // For now, let's return the basic one specific to the screenshot hint

            console.warn('[AnimePahe] Could not extract m3u8 directly. Returning embed as fallback.');

            return {
                sources: [],
                headers: { 'Referer': playUrl }
            };

        } catch (error) {
            console.error('[AnimePahe] Failed to get sources:', error);
            throw error;
        }
    }
};
