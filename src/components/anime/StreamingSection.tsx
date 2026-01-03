/**
 * StreamingSection - Component to stream anime episodes
 * 
 * Allows users to:
 * - Search for the anime on streaming providers
 * - Select a provider
 * - Browse and watch episodes
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    searchAnime,
    getAnimeInfo,
    getAvailableProviders,
    type ProviderType,
    type AnimeSearchResult,
    type StreamingEpisode
} from '../../services/tauriStreamingService';
import './StreamingSection.css';

interface StreamingSectionProps {
    animeTitle: string;
    anilistId: number;
}

export default function StreamingSection({ animeTitle, anilistId }: StreamingSectionProps) {
    const navigate = useNavigate();
    const providers = getAvailableProviders();

    const [provider, setProvider] = useState<ProviderType>('zoro');
    const [searchResults, setSearchResults] = useState<AnimeSearchResult[]>([]);
    const [selectedAnime, setSelectedAnime] = useState<string | null>(null);
    const [episodes, setEpisodes] = useState<StreamingEpisode[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Search for anime when provider changes or first expanded
    useEffect(() => {
        if (!isExpanded) return;

        const search = async () => {
            setLoading(true);
            setError(null);
            setSearchResults([]);
            setSelectedAnime(null);
            setEpisodes([]);

            try {
                const results = await searchAnime(animeTitle, provider);
                setSearchResults(results);

                // Auto-select first result
                if (results.length > 0) {
                    setSelectedAnime(results[0].id);
                }
            } catch (err) {
                console.error('[StreamingSection] Search failed:', err);
                setError('Failed to search. Try a different provider.');
            } finally {
                setLoading(false);
            }
        };

        search();
    }, [provider, animeTitle, isExpanded]);

    // Load episodes when anime is selected
    useEffect(() => {
        if (!selectedAnime) return;

        const loadEpisodes = async () => {
            setLoading(true);
            setError(null);

            try {
                const info = await getAnimeInfo(selectedAnime, provider);
                setEpisodes(info.episodes);
            } catch (err) {
                console.error('[StreamingSection] Failed to load episodes:', err);
                setError('Failed to load episodes.');
            } finally {
                setLoading(false);
            }
        };

        loadEpisodes();
    }, [selectedAnime, provider]);

    // Navigate to stream page
    const handleWatch = (episode: StreamingEpisode) => {
        const params = new URLSearchParams({
            title: animeTitle,
            episode: episode.number.toString(),
            anilistId: anilistId.toString(),
        });

        navigate(`/stream/${provider}/${encodeURIComponent(episode.id)}?${params.toString()}`);
    };

    return (
        <div className="streaming-section">
            <button
                className="streaming-toggle"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
                <span className="toggle-text">Stream Episodes</span>
                <span className="streaming-badge">BETA</span>
            </button>

            {isExpanded && (
                <div className="streaming-content">
                    {/* Provider Selector */}
                    <div className="provider-selector">
                        <label>Provider:</label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value as ProviderType)}
                        >
                            {providers.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Search Results (if multiple matches) */}
                    {searchResults.length > 1 && (
                        <div className="search-results">
                            <label>Select Match:</label>
                            <select
                                value={selectedAnime || ''}
                                onChange={(e) => setSelectedAnime(e.target.value)}
                            >
                                {searchResults.map((result) => (
                                    <option key={result.id} value={result.id}>
                                        {result.title} {result.subOrDub ? `(${result.subOrDub})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="streaming-loading">
                            <div className="loader-sm"></div>
                            <span>Loading...</span>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="streaming-error">
                            {error}
                        </div>
                    )}

                    {/* Episode List */}
                    {!loading && episodes.length > 0 && (
                        <div className="episode-grid">
                            {episodes.map((ep) => (
                                <button
                                    key={ep.id}
                                    className="episode-btn"
                                    onClick={() => handleWatch(ep)}
                                >
                                    <span className="ep-number">EP {ep.number}</span>
                                    {ep.title && <span className="ep-title">{ep.title}</span>}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No Episodes */}
                    {!loading && !error && episodes.length === 0 && searchResults.length > 0 && (
                        <div className="streaming-empty">
                            No episodes found for this selection.
                        </div>
                    )}

                    {/* No Results */}
                    {!loading && !error && searchResults.length === 0 && (
                        <div className="streaming-empty">
                            No results found. Try a different provider.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
