import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { resourceDir } from '@tauri-apps/api/path';

interface DownloadFolderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigured?: () => void;
}

/**
 * Dialog prompting user to configure a download folder before downloading manga.
 * Shows default path and allows user to use it or choose a custom folder.
 * On first download, shows this dialog with the option to use default.
 */
export function DownloadFolderDialog({ isOpen, onClose, onConfigured }: DownloadFolderDialogProps) {
    const navigate = useNavigate();
    const { updateSetting, updateSettings } = useSettings();
    const [selecting, setSelecting] = useState(false);
    const [defaultPath, setDefaultPath] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Get the default download path (app resource directory + Downloads)
    useEffect(() => {
        const getDefaultPath = async () => {
            try {
                const resDir = await resourceDir();
                // Use a Downloads subfolder within the resource directory
                const downloadsPath = `${resDir}Downloads`;
                setDefaultPath(downloadsPath);
            } catch (e) {
                console.error('Failed to get resource dir:', e);
                setDefaultPath('');
            } finally {
                setLoading(false);
            }
        };
        if (isOpen) {
            getDefaultPath();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleUseDefault = async () => {
        if (!defaultPath) return;

        // Update both the path and mark prompt as shown
        updateSettings({
            mangaDownloadPath: defaultPath,
            downloadFolderPromptShown: true
        });
        onConfigured?.();
        onClose();
    };

    const handleChooseFolder = async () => {
        setSelecting(true);
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Manga Download Folder'
            });

            if (selected && typeof selected === 'string') {
                updateSettings({
                    mangaDownloadPath: selected,
                    downloadFolderPromptShown: true
                });
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
        // Mark prompt as shown even if they go to settings
        updateSetting('downloadFolderPromptShown', true);
        onClose();
        navigate('/settings');
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-[#15151e] p-8 rounded-2xl border border-white/10 w-full max-w-[480px] shadow-2xl"
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
                        Choose where to save your downloaded manga chapters.
                        They will be stored as CBZ files that you can read offline.
                    </p>
                </div>

                {/* Default Path Preview */}
                {defaultPath && !loading && (
                    <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs text-white/40 mb-1 uppercase tracking-wider">Default Location</div>
                        <div className="text-sm text-white/80 font-mono break-all">{defaultPath}</div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                    {/* Use Default Button - Primary if we have a default path */}
                    {defaultPath && !loading && (
                        <button
                            onClick={handleUseDefault}
                            className="w-full py-3 px-4 rounded-xl font-semibold text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Use Default Location
                        </button>
                    )}

                    <button
                        onClick={handleChooseFolder}
                        disabled={selecting}
                        className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
                                Choose Different Folder
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleGoToSettings}
                        className="w-full py-2 text-sm text-white/50 hover:text-white/70 transition-colors"
                    >
                        Configure Later in Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DownloadFolderDialog;

