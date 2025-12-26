import React from 'react';

interface TabNavigationProps {
    onBack: () => void;
    onForward: () => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ onBack, onForward }) => {
    return (
        <div className="absolute top-0 left-0 z-20">
            {/* The Tab itself (cutout color) */}
            <div
                className="relative w-28 h-12 rounded-br-[32px] flex items-center justify-center gap-4"
                style={{ background: '#1E1F22' }}
            >
                {/* Inverted Corner Join - Right */}
                <div className="absolute -right-6 top-0 w-6 h-6" style={{ background: '#1E1F22' }}>
                    <div className="w-full h-full rounded-tl-full" style={{ background: '#2B2D31ff' }}></div>
                </div>

                {/* Inverted Corner Join - Bottom */}
                <div className="absolute left-0 -bottom-6 w-6 h-6" style={{ background: '#1E1F22' }}>
                    <div className="w-full h-full rounded-tl-full" style={{ background: '#2B2D31ff' }}></div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-4 mb-2 mr-2">
                    <button
                        onClick={onBack}
                        className="p-2 text-[#6a6a9e] hover:text-white transition-colors cursor-pointer text-2xl font-bold"
                        title="Back"
                    >
                        ‹
                    </button>
                    <button
                        onClick={onForward}
                        className="p-2 text-[#6a6a9e] hover:text-white transition-colors cursor-pointer text-2xl font-bold"
                        title="Forward"
                    >
                        ›
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TabNavigation;
