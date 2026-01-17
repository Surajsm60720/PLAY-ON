
import { HeartIcon, ChartIcon, FlameIcon, BookIcon, FilmIcon } from './Icons';

export interface StatItem {
    label: string;
    value: string;
    icon?: 'score' | 'rank' | 'popularity' | 'source' | 'anime' | 'manga';
    color?: string;
}

interface StatsGridProps {
    stats: StatItem[];
}

export function StatsGrid({ stats }: StatsGridProps) {
    const getIcon = (type?: string) => {
        switch (type) {
            case 'score': return <HeartIcon size={18} />;
            case 'rank': return <ChartIcon size={18} />;
            case 'popularity': return <FlameIcon size={18} />;
            case 'source': return <BookIcon size={18} />;
            case 'anime': return <FilmIcon size={18} />;
            case 'manga': return <BookIcon size={18} />;
            default: return null;
        }
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className="group relative p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 overflow-hidden"
                >
                    {/* Background Gradient Glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-${stat.color?.replace('text-', '')}/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                    <div className="relative flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2 mb-1 w-full">
                            <div className={`p-1.5 rounded-lg bg-white/5 ${stat.color} bg-opacity-10`}>
                                {getIcon(stat.icon)}
                            </div>
                            <span className="font-mono text-[10px] text-white/40 uppercase tracking-widest font-bold flex-1 text-right">
                                {stat.label}
                            </span>
                        </div>

                        <span className={`text-2xl font-bold tracking-tight ${stat.color} drop-shadow-sm truncate w-full`}>
                            {stat.value}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}
