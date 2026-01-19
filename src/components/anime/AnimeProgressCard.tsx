import { Anime } from '../../hooks/useAnimeData';
import ElasticSlider from '../ui/ElasticSlider';
import { updateMediaProgress } from '../../api/anilistClient';
import { useState } from 'react';
import { PlusIcon, CheckIcon } from '../ui/Icons';

interface AnimeProgressCardProps {
    anime: Anime;
    progress: number;
    onUpdate: (newProgress: number) => void;
    updating: boolean;
}

export function AnimeProgressCard({ anime, progress, onUpdate, updating }: AnimeProgressCardProps) {
    const percentage = anime.episodes ? Math.min((progress / anime.episodes) * 100, 100) : 0;
    const [score, setScore] = useState(anime.mediaListEntry?.score || 0);
    const [updatingScore, setUpdatingScore] = useState(false);



    // We need a ref to track the timer
    // Since we are inside a functional component, we can use a timeout directly if we import useRef.
    // Let's assume user accepts a direct implementation for now or I'll add useRef in a separate edit if needed.
    // Actually, let's just add the UI first.

    const commitScore = async (finalScore: number) => {
        try {
            setUpdatingScore(true);
            // Pass current progress and status to ensure validity and correct optimistic update
            await updateMediaProgress(
                anime.id,
                progress,
                anime.mediaListEntry?.status || 'CURRENT',
                Math.round(finalScore)
            );
        } catch (err) {
            console.error('Failed to update score:', err);
        } finally {
            setUpdatingScore(false);
        }
    };

    return (
        <div className="p-1 rounded-2xl bg-gradient-to-r from-white/10 to-transparent p-[1px]">
            <div className="bg-[#121214]/80 backdrop-blur-xl rounded-2xl p-6 border border-white/5 flex flex-col gap-6">


                {/* Progress Row */}
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-mono text-xs text-lavender-mist uppercase tracking-widest">PROGRESS</span>
                            <span className="font-mono text-xl font-bold">{progress} <span className="text-white/30">/ {anime.episodes || '?'}</span></span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-lavender-mist to-sky-blue relative transition-all duration-300 ease-out"
                                style={{ width: `${percentage}%` }}
                            >
                                <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white shadow-[0_0_10px_white]" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button
                            disabled={progress <= 0 || updating}
                            onClick={() => onUpdate(progress - 1)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white disabled:opacity-30"
                        >
                            −
                        </button>
                        <button
                            onClick={() => onUpdate(progress + 1)}
                            disabled={(anime.episodes ? progress >= anime.episodes : false) || updating}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-black hover:bg-gray-200 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:shadow-none"
                        >
                            <PlusIcon size={14} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Score Slider Row */}
                <div className="flex flex-col md:flex-row items-center gap-6 border-t border-white/5 pt-6">
                    <div className="flex-1 w-full flex items-center justify-between">
                        <span className="font-mono text-xs text-mint-tonic uppercase tracking-widest">SCORING</span>

                        <div className="w-64">
                            <ElasticSlider
                                leftIcon={<span className="text-xs font-mono">0</span>}
                                rightIcon={<span className="text-xs font-mono">100</span>}
                                startingValue={0}
                                defaultValue={score}
                                maxValue={100}
                                isStepped
                                stepSize={1}
                                className="w-full"
                                onChange={(val) => {
                                    setScore(val);
                                    // Debounce implementation would go here for API
                                    // For now we just update local display
                                }}
                            />
                        </div>
                        {/* We need a commit button or auto-save. Auto-save is better but needs debounce. 
                             Adding a checkmark button next to it for manual save if unsure about debounce complexity without custom hook.
                         */}
                        <button
                            onClick={() => commitScore(score)}
                            disabled={updatingScore}
                            className="ml-4 w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 transition-all text-mint-tonic"
                        >
                            {updatingScore ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckIcon size={14} />}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

