import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { openPath } from '@tauri-apps/plugin-opener';
import Folder from '../components/ui/Folder';
import AniListSearchDialog from '../components/ui/AniListSearchDialog';
import { useFolderMappings } from '../hooks/useFolderMappings';
import { useNowPlaying } from '../context/NowPlayingContext';

interface FileItem {
    name: string;
    path: string;
    is_dir: boolean;
    size?: number;
    last_modified?: number;
}

const formatSize = (bytes?: number): string => {
    if (bytes === undefined || bytes === null) return '';
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (timestamp?: number): string => {
    if (!timestamp) return '';
    return new Date(timestamp * 1000).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// Get file icon based on extension
const getFileIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
    const subExts = ['srt', 'ass', 'ssa', 'sub', 'vtt'];

    if (videoExts.includes(ext || '')) return '🎬';
    if (audioExts.includes(ext || '')) return '🎵';
    if (imageExts.includes(ext || '')) return '🖼️';
    if (subExts.includes(ext || '')) return '📝';
    return '📄';
};

function LocalFolder() {
    const { folderPath } = useParams();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Folder-to-AniList mapping hook
    const { getMappingByPath, addMapping, removeMapping } = useFolderMappings();

    // Now Playing context to trigger manual sessions
    const { startManualSession } = useNowPlaying();

    // Decode the path from URL
    const currentPath = folderPath ? decodeURIComponent(folderPath) : '';
    const folderName = currentPath.split(/[\\/]/).pop() || '';

    // Check if this folder is already linked to an anime
    const currentMapping = getMappingByPath(currentPath);

    useEffect(() => {
        async function loadFiles() {
            if (!currentPath) return;

            setLoading(true);
            setError(null);
            try {
                const result = await invoke<FileItem[]>('get_folder_contents', { path: currentPath });
                setFiles(result);
            } catch (err) {
                console.error("Failed to load folder contents:", err);
                setError(String(err));
            } finally {
                setLoading(false);
            }
        }

        loadFiles();
    }, [currentPath]);

    const handleItemClick = async (item: FileItem) => {
        if (item.is_dir) {
            // Navigate into subdirectory
            navigate(`/local/${encodeURIComponent(item.path)}`);
        } else {
            // Open file in default application
            try {
                await openPath(item.path);

                // If this folder is linked to an anime, trigger manual Now Playing session
                if (currentMapping) {
                    const ext = item.name.split('.').pop()?.toLowerCase();
                    const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'];

                    if (videoExts.includes(ext || '')) {
                        // Parse episode number from filename
                        // Patterns: E10, EP10, Episode 10, - 10, 10.mkv, etc.
                        const episodeMatch = item.name.match(
                            /(?:E|EP|Episode\s*)?(\d{1,3})(?:\s*v\d)?(?:\s*[\[\(\-]|\s*\.\w{3,4}$)/i
                        );
                        const episode = episodeMatch ? parseInt(episodeMatch[1], 10) : 1;

                        console.log(`[LocalFolder] Starting Now Playing session: ${currentMapping.animeName} Ep ${episode}`);

                        // Trigger the Now Playing session via context
                        startManualSession({
                            anilistId: currentMapping.anilistId,
                            animeName: currentMapping.animeName,
                            coverImage: currentMapping.coverImage,
                            episode,
                            filePath: item.path
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to open file:", err);
            }
        }
    };

    if (!currentPath) {
        return <div className="text-white p-8">No folder specified.</div>;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-zen-accent)]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center py-10 px-8 bg-white/5 rounded-2xl border border-dashed border-red-500/30">
                    <p className="text-red-400">Error loading folder: {error}</p>
                </div>
            </div>
        );
    }



    // ... (existing code)

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const directories = filteredFiles.filter(f => f.is_dir);
    const regularFiles = filteredFiles.filter(f => !f.is_dir);

    // Mock items to put "inside" the folders
    const mockFolderItems = [
        <div key="1" className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">🎬</div>,
        <div key="2" className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">📁</div>,
        <div key="3" className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">📄</div>
    ];

    return (
        <div className="max-w-[1400px] mx-auto pb-10 px-6 min-h-screen">
            {/* Header */}
            <div className="mb-10 mt-6 px-2 flex items-end justify-between">
                <div>
                    <h1
                        className="text-4xl font-bold text-white mb-2"
                        style={{
                            fontFamily: 'var(--font-rounded)',
                            letterSpacing: '-0.02em',
                            textShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }}
                    >
                        {currentPath.split(/[\\/]/).pop()}
                    </h1>
                    <p
                        className="text-white/40 text-sm font-mono break-all mb-4"
                        style={{ fontFamily: 'var(--font-mono)' }}
                    >
                        {currentPath}
                    </p>

                    {/* AniList Tracking Section */}
                    {currentMapping ? (
                        // Linked state: show anime info with unlink button
                        <div
                            className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10"
                            style={{ background: 'rgba(180, 162, 246, 0.1)' }}
                        >
                            {currentMapping.coverImage && (
                                <img
                                    src={currentMapping.coverImage}
                                    alt={currentMapping.animeName}
                                    className="w-10 h-14 object-cover rounded-lg"
                                />
                            )}
                            <div className="flex flex-col">
                                <span
                                    className="text-xs text-white/40 uppercase tracking-wider"
                                    style={{ fontFamily: 'var(--font-mono)' }}
                                >
                                    Linked to AniList
                                </span>
                                <span
                                    className="text-sm font-semibold text-white"
                                    style={{ fontFamily: 'var(--font-rounded)' }}
                                >
                                    {currentMapping.animeName}
                                </span>
                            </div>
                            <button
                                onClick={() => removeMapping(currentPath)}
                                className="ml-4 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                                style={{ fontFamily: 'var(--font-rounded)' }}
                            >
                                Unlink
                            </button>
                        </div>
                    ) : (
                        // Not linked: show track button
                        <button
                            onClick={() => setIsSearchDialogOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 hover:scale-105"
                            style={{
                                fontFamily: 'var(--font-rounded)',
                                background: 'linear-gradient(135deg, var(--color-zen-accent), #9c7cf0)',
                                color: 'white',
                                boxShadow: '0 4px 15px rgba(180, 162, 246, 0.3)'
                            }}
                        >
                            <span>🔗</span>
                            Track on AniList
                        </button>
                    )}
                </div>

                {/* Search Bar */}
                <div className="relative group mb-1">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter files..."
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-medium w-64 focus:bg-white/10 focus:border-white/20 outline-none transition-all duration-300 placeholder-white/30"
                        style={{ fontFamily: 'var(--font-rounded)' }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/40">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                </div>
            </div>

            {/* Folders Section */}
            {directories.length > 0 && (
                <div className="mb-10">
                    <h3
                        className="text-lg font-bold text-white mb-6 px-2 flex items-center gap-3"
                        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-zen-accent)] shadow-[0_0_8px_var(--color-zen-accent)]"></div>
                        FOLDERS
                    </h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-8">
                        {directories.map((dir) => (
                            <div
                                key={dir.path}
                                className="flex flex-col items-center gap-3 group cursor-pointer"
                                onClick={() => handleItemClick(dir)}
                            >
                                <Folder
                                    size={0.85}
                                    color="#B4A2F6"
                                    items={mockFolderItems}
                                    className="transition-transform duration-300 group-hover:scale-105"
                                />
                                <span
                                    className="text-sm text-white/60 font-medium truncate max-w-full text-center group-hover:text-white transition-colors"
                                    style={{ fontFamily: 'var(--font-rounded)' }}
                                >
                                    {dir.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Files Section */}
            {regularFiles.length > 0 && (
                <div className="mb-10">
                    <h3
                        className="text-lg font-bold text-white mb-6 px-2 flex items-center gap-3"
                        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-mint-tonic)] shadow-[0_0_8px_var(--color-mint-tonic)]"></div>
                        FILES
                    </h3>
                    <div className="flex flex-col gap-2">
                        {regularFiles.map((file, index) => (
                            <div
                                key={file.path}
                                onClick={() => handleItemClick(file)}
                                className="group grid grid-cols-[40px_1fr_120px_100px] gap-4 items-center p-4 rounded-xl cursor-pointer transition-all duration-300 border border-transparent hover:border-white/10 hover:bg-white/5"
                                style={{
                                    background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                                }}
                            >
                                {/* Icon */}
                                <div className="text-2xl text-center opacity-70 group-hover:opacity-100 transition-opacity">
                                    {getFileIcon(file.name)}
                                </div>

                                {/* Name */}
                                <div
                                    className="font-medium text-white/80 group-hover:text-white truncate transition-colors"
                                    style={{ fontFamily: 'var(--font-rounded)' }}
                                >
                                    {file.name}
                                </div>

                                {/* Date */}
                                <div
                                    className="text-sm text-white/30 group-hover:text-white/50 transition-colors"
                                    style={{ fontFamily: 'var(--font-mono)' }}
                                >
                                    {formatDate(file.last_modified)}
                                </div>

                                {/* Size */}
                                <div
                                    className="text-sm text-white/30 group-hover:text-white/50 text-right transition-colors"
                                    style={{ fontFamily: 'var(--font-mono)' }}
                                >
                                    {formatSize(file.size)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {files.length === 0 && (
                <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p className="text-white/40" style={{ fontFamily: 'var(--font-rounded)' }}>
                        This folder is empty
                    </p>
                </div>
            )}

            {/* AniList Search Dialog */}
            <AniListSearchDialog
                isOpen={isSearchDialogOpen}
                onClose={() => setIsSearchDialogOpen(false)}
                onSelect={(anime) => {
                    addMapping(currentPath, anime.id, anime.title, anime.coverImage);
                    setIsSearchDialogOpen(false);
                }}
                initialSearchTerm={folderName}
            />
        </div>
    );
}

export default LocalFolder;
