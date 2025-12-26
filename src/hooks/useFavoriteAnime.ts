import { useState, useEffect } from 'react';
import { fetchPublicUser } from '../api/anilistClient';

// Use this username to fetch public data
const ANILIST_USERNAME = 'MemestaVedas';

/**
 * Custom hook to fetch and manage the user's favorite anime from AniList.
 */
export function useFavoriteAnime() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [coverImages, setCoverImages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        /**
         * Loads favorites from public user data.
         */
        async function loadFavorites() {
            try {
                setLoading(true);
                const result = await fetchPublicUser(ANILIST_USERNAME);

                if (result.data && result.data.User && result.data.User.favourites.anime.nodes) {
                    // Limit to first 5 favorites as requested
                    const nodes = result.data.User.favourites.anime.nodes.slice(0, 5);
                    setFavorites(nodes);

                    // Extract only the large cover images for the BounceCards
                    const images = nodes.map((node: any) => node.coverImage.large);
                    setCoverImages(images);
                }
            } catch (err) {
                console.error('Failed to load favorites:', err);
                setError('Failed to load favorites from AniList');
            } finally {
                setLoading(false);
            }
        }

        loadFavorites();
    }, []);

    return { favorites, coverImages, loading, error };
}
