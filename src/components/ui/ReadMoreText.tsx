import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp } from './Icons';

interface ReadMoreTextProps {
    content: string;
    maxHeight?: number; // Height in pixels to show before truncating
    className?: string;
}

export const ReadMoreText: React.FC<ReadMoreTextProps> = ({
    content,
    maxHeight = 100,
    className = ""
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [shouldShowToggle, setShouldShowToggle] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (contentRef.current) {
            setShouldShowToggle(contentRef.current.scrollHeight > maxHeight);
        }
    }, [content, maxHeight]);

    return (
        <div className={`flex flex-col ${className}`}>
            <div
                className={`relative overflow-hidden transition-all duration-500 ease-in-out`}
                style={{
                    maxHeight: isExpanded ? 'none' : `${maxHeight}px`
                }}
            >
                <div
                    ref={contentRef}
                    className="text-sm leading-relaxed text-gray-200/90 font-light pr-4"
                    dangerouslySetInnerHTML={{ __html: content }}
                />

                {/* Gradient Mask for collapsed state */}
                {!isExpanded && shouldShowToggle && (
                    <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#121214] to-transparent pointer-events-none" />
                )}
            </div>

            {shouldShowToggle && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="self-start mt-2 text-xs font-bold tracking-wider text-mint-tonic hover:text-white uppercase flex items-center gap-1 transition-colors group"
                >
                    {isExpanded ? 'Read Less' : 'Read More'}
                    <span className="transform transition-transform duration-300 group-hover:translate-y-0.5">
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                </button>
            )}
        </div>
    );
};
