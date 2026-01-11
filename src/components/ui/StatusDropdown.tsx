import React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface StatusOption {
    value: string;
    label: string;
    icon: React.ReactNode;
}

interface StatusDropdownProps {
    currentStatus: string | null;
    onStatusChange: (status: string) => void;
    options: StatusOption[];
    loading?: boolean;
    className?: string;
}

// Color mapping for statuses
const getStatusColor = (status: string) => {
    switch (status) {
        case 'CURRENT': return '#B4A2F6'; // App Accent (Lavender)
        case 'COMPLETED': return '#4ADE80'; // Green
        case 'PAUSED': return '#FACC15'; // Yellow
        case 'DROPPED': return '#F87171'; // Red
        case 'PLANNING': return '#F472B6'; // Pink
        case 'REPEATING': return '#FFFFFF'; // White
        default: return '#B4A2F6';
    }
};

const getGlowStyle = (status: string) => {
    const color = getStatusColor(status);
    return `0 0 20px ${color}40, 0 0 10px ${color}20`; // Subtle glow
};

export function StatusDropdown({ currentStatus, onStatusChange, options, loading = false, className = '' }: StatusDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Handle null/empty status (Not in list)
    const currentOption = options.find(o => o.value === currentStatus) || {
        value: '',
        label: 'Add to List',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        )
    };
    const currentColor = currentStatus ? getStatusColor(currentStatus) : '#ffffff';

    const handleSelect = (value: string) => {
        onStatusChange(value);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`}>
            <motion.button
                onClick={() => !loading && setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border backdrop-blur-md transition-all duration-300 ${!currentStatus ? 'bg-white/5 border-white/20 hover:bg-white/10' : ''}`}
                style={currentStatus ? {
                    backgroundColor: `${currentColor}15`, // 15% opacity background
                    borderColor: `${currentColor}40`,     // 40% opacity border
                    color: currentColor,
                    boxShadow: getGlowStyle(currentStatus)
                } : {}}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <div className="flex items-center gap-3 font-bold">
                    <span className="text-lg">{currentOption.icon}</span>
                    <span className="uppercase tracking-wider text-sm">{currentOption.label}</span>
                </div>

                <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ rotate: isOpen ? 180 : 0 }}
                >
                    <path d="M6 9l6 6 6-6" />
                </motion.svg>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1"
                    >
                        {options.map(option => {
                            const optionColor = getStatusColor(option.value);
                            const isSelected = option.value === currentStatus;

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 text-left relative"
                                >
                                    <span style={{ color: optionColor }} className="text-base">
                                        {option.icon}
                                    </span>
                                    <span className={`font-medium ${isSelected ? 'text-white' : 'text-white/60'}`}>
                                        {option.label}
                                    </span>

                                    {isSelected && (
                                        <div
                                            className="absolute left-0 top-0 bottom-0 w-1"
                                            style={{ backgroundColor: optionColor }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
