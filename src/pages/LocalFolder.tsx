import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { openPath } from '@tauri-apps/plugin-opener';
import Folder from '../components/ui/Folder';

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

    // Decode the path from URL
    const currentPath = folderPath ? decodeURIComponent(folderPath) : '';

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

    const directories = files.filter(f => f.is_dir);
    const regularFiles = files.filter(f => !f.is_dir);

    // Mock items to put "inside" the folders
    const mockFolderItems = [
        <div key="1" className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">🎬</div>,
        <div key="2" className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">📁</div>,
        <div key="3" className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">📄</div>
    ];

    return (
        <div className="max-w-[1400px] mx-auto pb-10 px-6 min-h-screen">
            {/* Header */}
            <div className="mb-10 mt-6 px-2">
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
                    className="text-white/40 text-sm font-mono break-all"
                    style={{ fontFamily: 'var(--font-mono)' }}
                >
                    {currentPath}
                </p>
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
                                onDoubleClick={() => handleItemClick(dir)}
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
        </div>
    );
}

export default LocalFolder;
