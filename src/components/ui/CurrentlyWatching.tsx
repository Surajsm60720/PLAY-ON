/**
 * Sidebar Component - Discord-style left navigation
 * 
 * Contains:
 * - Main navigation items (Media List, History, Statistics)
 * - Profile section at bottom
 */

import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

/**
 * Mock data for the generic shell
 */
const MOCK_ANIME_LIST = [
    {
        id: 1,
        progress: 9,
        media: {
            id: 1,
            title: { romaji: 'Solo Leveling', english: 'Solo Leveling' },
            coverImage: { medium: '/assets/anime/anime_mock_3_1766682294612.png' },
            episodes: 12,
        }
    },
    {
        id: 2,
        progress: 24,
        media: {
            id: 2,
            title: { romaji: 'Sousou no Frieren', english: 'Frieren: Beyond Journey\'s End' },
            coverImage: { medium: '/assets/anime/anime_mock_4_1766682324192.png' },
            episodes: 28,
        }
    }
];

function CurrentlyWatching() {
    const { user, loading: authLoading } = useAuth();
    const [animeList, setAnimeList] = useState(MOCK_ANIME_LIST);
    const [updating, setUpdating] = useState(false);

    // Show loading state
    if (authLoading) {
        return <div style={{ padding: '2rem', color: '#B5BAC1' }}>Loading your profile...</div>;
    }

    // Handle progress increment (Mocked)
    async function incrementProgress(mediaId: number) {
        setUpdating(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        setAnimeList(prev => prev.map(entry => {
            if (entry.media.id === mediaId) {
                return { ...entry, progress: entry.progress + 1 };
            }
            return entry;
        }));

        setUpdating(false);
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h2 style={{ color: '#374151', marginBottom: '1.5rem' }}>
                📺 Currently Watching {user ? `- ${user.name}` : ''}
            </h2>

            {animeList.length === 0 ? (
                <p style={{ color: '#6B7280' }}>No titles currently watching</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {animeList.map((entry) => (
                        <div
                            key={entry.id}
                            style={{
                                display: 'flex',
                                gap: '1.5rem',
                                padding: '1.25rem',
                                background: 'rgba(255, 255, 255, 0.8)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            {/* Poster Cover Image */}
                            <img
                                src={entry.media.coverImage.medium}
                                alt={entry.media.title.romaji}
                                style={{
                                    width: '80px',
                                    height: '110px',
                                    objectFit: 'cover',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                }}
                            />

                            {/* Info */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0', color: '#1F2937', fontSize: '1.1rem' }}>
                                    {entry.media.title.english || entry.media.title.romaji}
                                </h3>

                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{
                                        height: '6px',
                                        width: '100%',
                                        background: '#E5E7EB',
                                        borderRadius: '3px',
                                        overflow: 'hidden',
                                        marginBottom: '0.5rem',
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${(entry.progress / (entry.media.episodes || 1)) * 100}%`,
                                            background: 'linear-gradient(90deg, #C7B8EA, #FFB5C5)',
                                            borderRadius: '3px',
                                            transition: 'width 0.3s ease',
                                        }} />
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6B7280', fontWeight: '500' }}>
                                        Progress: <span style={{ color: '#C7B8EA' }}>{entry.progress}</span> / {entry.media.episodes || '?'}
                                    </p>
                                </div>

                                {/* Update Button */}
                                <button
                                    onClick={() => incrementProgress(entry.media.id)}
                                    disabled={updating}
                                    style={{
                                        alignSelf: 'flex-start',
                                        padding: '0.5rem 1rem',
                                        background: 'linear-gradient(135deg, #C7B8EA 0%, #B8A4E8 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        cursor: updating ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 4px rgba(199, 184, 234, 0.3)',
                                    }}
                                    onMouseEnter={(e) => !updating && (e.currentTarget.style.transform = 'translateY(-1px)')}
                                    onMouseLeave={(e) => !updating && (e.currentTarget.style.transform = 'translateY(0)')}
                                >
                                    {updating ? 'Updating...' : '+1 Episode'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default CurrentlyWatching;

/**
 * USAGE IN YOUR APP:
 * ==================
 * 
 * // In Home.tsx or any page
 * import CurrentlyWatching from '../components/CurrentlyWatching';
 * 
 * function Home() {
 *     return (
 *         <Layout>
 *             <CurrentlyWatching />
 *         </Layout>
 *     );
 * }
 */
