import React from 'react';
import { Anime } from '../../hooks/useAnimeData';
import './AnimeCard.css';

interface AnimeCardProps {
    anime: Anime;
    onClick: (id: number) => void;
    progress?: number;
    onResume?: () => void; // Optional resume callback for linked manga
    isResuming?: boolean; // Optional loading state for resume action
    compact?: boolean;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick, progress, onResume, isResuming = false, compact = false }) => {
    const title = anime.title.english || anime.title.romaji;
    const episodes = anime.episodes || '?';
    const hasProgress = progress !== undefined;

    const handleResumeClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (!isResuming) {
            onResume?.();
        }
    };

    return (
        <div
            className={`anime-card ${compact ? 'anime-card--compact' : ''}`}
            onClick={() => onClick(anime.id)}
            style={compact ? { fontSize: '0.9em' } : undefined}
        >
            {/* Progress Badge with Inverted Corners */}
            {hasProgress && (
                <div className="anime-card__progress-badge" style={compact ? { padding: '2px 6px', fontSize: '0.75rem' } : undefined}>
                    <span className="anime-card__progress-current">{progress}</span>
                    <span className="anime-card__progress-separator">/</span>
                    <span className="anime-card__progress-total">{episodes}</span>
                </div>
            )}

            {/* Resume Button */}
            {onResume && (
                <button
                    className={`anime-card__resume-btn ${isResuming ? 'anime-card__resume-btn--loading' : ''}`}
                    onClick={handleResumeClick}
                    title="Resume reading"
                    disabled={isResuming}
                    style={compact ? { width: '32px', height: '32px' } : undefined}
                >
                    {isResuming ? (
                        <div className="anime-card__resume-spinner" style={compact ? { width: '16px', height: '16px' } : undefined} />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width={compact ? "14" : "16"} height={compact ? "14" : "16"} viewBox="0 0 24 24" fill="currentColor" stroke="none">
                            <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                    )}
                </button>
            )}

            {/* Image Container */}
            <div className={`anime-card__image-wrapper ${hasProgress ? 'anime-card__image-wrapper--notched' : ''}`}>
                <img
                    src={anime.coverImage.large}
                    alt={title}
                    className="anime-card__image"
                    loading="lazy"
                />

                {/* Hover Overlay */}
                <div className="anime-card__overlay" style={compact ? { padding: '12px' } : undefined}>
                    {/* Format Tag (Moved to Top-Left via absolute positioning) */}
                    {anime.format && (
                        <span className="anime-card__format" style={compact ? { fontSize: '0.65rem', padding: '2px 6px' } : undefined}>{anime.format}</span>
                    )}

                    <h3 className="anime-card__title" style={compact ? { fontSize: '0.9rem', marginBottom: '2px' } : undefined}>{title}</h3>
                    {anime.averageScore && (
                        <div className="anime-card__meta">
                            <span className="anime-card__score" style={compact ? { fontSize: '0.75rem' } : undefined}>{anime.averageScore}% Match</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AnimeCard;

