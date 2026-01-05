import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

interface DownloadFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigured?: () => void;
}

/**
 * Dialog prompting user to configure a download folder before downloading manga.
 * Shown when user attempts to download without having configured a folder.
 */
export function DownloadFolderDialog({ isOpen, onClose, onConfigured }: DownloadFolderDialogProps) {
    const navigate = useNavigate();
    const { updateSetting } = useSettings();
    const [selecting, setSelecting] = useState(false);

    if (!isOpen) return null;

    const handleConfigureNow = async () => {
        setSelecting(true);
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Manga Download Folder'
            });

            if (selected && typeof selected === 'string') {
                updateSetting('mangaDownloadPath', selected);
                onConfigured?.();
                onClose();
            }
        } catch (e) {
            console.error('Failed to select folder:', e);
        } finally {
            setSelecting(false);
        }
    };

    const handleGoToSettings = () => {
        onClose();
        navigate('/settings');
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-[#15151e] p-8 rounded-2xl border border-white/10 w-full max-w-[420px] shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </div>
                </div>

                {/* Title & Message */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                        Configure Download Folder
                    </h3>
                    <p className="text-sm text-white/60 leading-relaxed">
                        To download manga chapters, please configure a download folder first.
                        Your manga will be saved as CBZ files in this location.
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleConfigureNow}
                        disabled={selecting}
                        className="w-full py-3 px-4 rounded-xl font-semibold text-black bg-white hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {selecting ? (
                            <>
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Selecting...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                                </svg>
                                Choose Folder
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleGoToSettings}
                        className="w-full py-3 px-4 rounded-xl font-medium text-white/80 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        Go to Settings
                    </button>

                    <button
                        onClick={onClose}
                        className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DownloadFolderDialog;
