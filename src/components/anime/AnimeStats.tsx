import { Anime } from '../../hooks/useAnimeData';
import { StatsGrid, StatItem } from '../ui/StatsGrid';

interface AnimeStatsProps {
    anime: Anime;
}

export function AnimeStats({ anime }: AnimeStatsProps) {
    // Find the highest rank (usually "RATED" or "POPULAR")
    const allTimeRank = anime.rankings?.find(r => r.allTime && r.type === 'RATED')?.rank;
    const popularity = anime.popularity?.toLocaleString();
    const source = anime.source?.replace(/_/g, ' ') || 'Original';

    const stats: StatItem[] = [
        { label: 'SCORE', value: anime.averageScore ? `${anime.averageScore}%` : 'N/A', color: 'text-mint-tonic', icon: 'score' },
        { label: 'RANK', value: allTimeRank ? `#${allTimeRank}` : 'N/A', color: 'text-sky-blue', icon: 'rank' },
        { label: 'POPULARITY', value: popularity ? popularity : 'N/A', color: 'text-pastels-pink', icon: 'popularity' },
        { label: 'SOURCE', value: source, color: 'text-white', icon: 'anime' }
    ];

    return <StatsGrid stats={stats} />;
}
