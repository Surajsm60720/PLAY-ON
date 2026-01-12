/**
 * GogoAnime Extension (Manual Implementation)
 * 
 * Scrapes anitaku.to (GogoAnime) directly using Tauri HTTP plugin.
 * Bypasses CORS and provides reliable backup.
 */

import { AnimeSource, Anime, Episode, EpisodeSources, AnimeSearchResult, AnimeSearchFilter } from '../services/anime-sources/AnimeSource';
import { fetch } from '@tauri-apps/plugin-http';

const BASE_URL = 'https://anitaku.to'; // Official domain (redirects if changed)
const AJAX_URL = 'https://ajax.gogocdn.net/ajax';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Referer': BASE_URL,
    'Origin': BASE_URL
};

export const GogoAnimeExtension: AnimeSource = {
    id: 'gogoanime',
    name: 'GogoAnime',
    baseUrl: BASE_URL,
    lang: 'en',
    iconUrl: 'https://gogocdn.net/images/favicon-ajax.png',

    async search(filter: AnimeSearchFilter): Promise<AnimeSearchResult> {
        try {
            const query = filter.query || '';
            const url = `${BASE_URL}/search.html?keyword=${encodeURIComponent(query)}&page=${filter.page || 1}`;
            console.log(`[Gogo] Searching: ${url}`);

            const response = await fetch(url, { method: 'GET', headers: HEADERS });
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');

            const animeList: Anime[] = [];
            const items = doc.querySelectorAll('.last_episodes > ul > li');

            items.forEach(item => {
                const link = item.querySelector('.name a');
                const img = item.querySelector('.img a img');
                const released = item.querySelector('.released');

                if (link) {
                    const href = link.getAttribute('href') || '';
                    const id = href.split('/category/')[1] || ''; // Extract ID from /category/naruto
                    const title = link.getAttribute('title') || link.textContent || 'Unknown';
                    const coverUrl = img?.getAttribute('src') || '';
                    const date = released?.textContent?.replace('Released:', '').trim();

                    if (id) {
                        animeList.push({
                            id,
                            title,
                            coverUrl,
                            status: 'unknown',
                            releaseDate: date
                        });
                    }
                }
            });

            const hasNextPage = !!doc.querySelector('.pagination .next');

            return { anime: animeList, hasNextPage };
        } catch (error) {
            console.error('[Gogo] Search failed:', error);
            return { anime: [], hasNextPage: false };
        }
    },

    async getAnimeInfo(animeId: string): Promise<Anime> {
        try {
            const url = `${BASE_URL}/category/${animeId}`;
            console.log(`[Gogo] Fetching details: ${url}`);

            const response = await fetch(url, { method: 'GET', headers: HEADERS });
            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, 'text/html');

            const infoBody = doc.querySelector('.anime_info_body_bg');
            const title = infoBody?.querySelector('h1')?.textContent?.trim() || 'Unknown';
            const coverUrl = infoBody?.querySelector('img')?.getAttribute('src') || '';

            // Extract description, status, etc. would go here but keeping it simple
            const description = infoBody?.querySelectorAll('p.type')[1]?.textContent?.replace('Plot Summary:', '').trim() || '';

            return {
                id: animeId,
                title,
                coverUrl,
                description,
                status: 'unknown',
                // We'll scrape total episodes in getEpisodes via the list
            };
        } catch (error) {
            console.error('[Gogo] Failed to get info:', error);
            throw error;
        }
    },

    async getEpisodes(animeId: string): Promise<Episode[]> {
        try {
            console.log(`[Gogo] Fetching episodes for: ${animeId}`);
            // 1. Get the movie_id from the category page
            const categoryUrl = `${BASE_URL}/category/${animeId}`;
            const catResponse = await fetch(categoryUrl, { method: 'GET', headers: HEADERS });
            console.log(`[Gogo] Status: ${catResponse.status}`);
            const catHtml = await catResponse.text();

            const docStub = new DOMParser().parseFromString(catHtml, 'text/html');
            const pageTitle = docStub.querySelector('title')?.textContent || 'No Title';
            console.log(`[Gogo] Page Title: ${pageTitle}`);

            // Regex for: <input type="hidden" value="2341" id="movie_id" class="movie_id">

            // Improved regex to handle attributes in any order with anything in between
            const inputMatch = catHtml.match(/<input[^>]+id="movie_id"[^>]*>/) || catHtml.match(/<input[^>]+class="movie_id"[^>]*>/);
            const valueMatch = inputMatch ? inputMatch[0].match(/value="(\d+)"/) : null;
            const movieId = valueMatch ? valueMatch[1] : null;

            if (!movieId) {
                console.error('[Gogo] Could not find movie_id');
                // Find where "movie_id" occurs to help debug
                const index = catHtml.indexOf('movie_id');
                if (index !== -1) {
                    console.log('[Gogo] Context around movie_id:', catHtml.substring(index - 100, index + 150));
                } else {
                    console.log('[Gogo] "movie_id" string not found in HTML');
                }
                return [];
            }

            // 2. Fetch episode list via AJAX
            // Note: default aliases often use 0 to 2000 to get all
            const listUrl = `${AJAX_URL}/load-list-episode?ep_start=0&ep_end=2000&id=${movieId}&default_ep=0&alias=${animeId}`;
            const listResp = await fetch(listUrl, { method: 'GET', headers: HEADERS });
            const listHtml = await listResp.text();
            const doc = new DOMParser().parseFromString(listHtml, 'text/html');

            const episodes: Episode[] = [];
            const items = doc.querySelectorAll('#episode_related > li');

            items.forEach(item => {
                const link = item.querySelector('a');
                if (link) {
                    // href is usually /naruto-episode-1
                    const epId = link.getAttribute('href')?.trim()?.replace(/^\//, '') || ''; // remove leading slash
                    const numText = item.querySelector('.name')?.textContent?.replace('EP', '').trim() || '0';

                    if (epId) {
                        episodes.push({
                            id: epId,
                            number: parseFloat(numText),
                            title: `Episode ${numText}`,
                            isFiller: false
                        });
                    }
                }
            });

            return episodes.reverse(); // Gogo usually lists usually newest first? Check order.
        } catch (error) {
            console.error('[Gogo] Failed to get episodes:', error);
            return [];
        }
    },

    async getEpisodeSources(episodeId: string): Promise<EpisodeSources> {
        try {
            // episodeId is e.g. "naruto-episode-1"
            const url = `${BASE_URL}/${episodeId}`;
            console.log(`[Gogo] Fetching sources page: ${url}`);

            // This is where we'd extract the iframe URL
            // Then extract from the iframe (Gogo-Stream).
            // That is complex (encryption often involved).

            // For now, we return the Referer so "Watch on Website" works impeccably.

            return {
                sources: [],
                headers: { 'Referer': url }
            };
        } catch (error) {
            console.error('[Gogo] Failed to get sources:', error);
            throw error;
        }
    }
};
