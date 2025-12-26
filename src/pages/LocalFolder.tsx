import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';

interface FileItem {
    name: string;
    path: string;
    is_dir: boolean;
    size?: number;
}

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

    const handleItemClick = (item: FileItem) => {
        if (item.is_dir) {
            // Navigate into subdirectory
            navigate(`/local/${encodeURIComponent(item.path)}`);
        } else {
            // Play video (future implementation - for now just log or maybe open)
            console.log("Play video:", item.path);
        }
    };

    if (!currentPath) {
        return <div className="text-white p-8">No folder specified.</div>;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-[#B5BAC1]">
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-400 p-8">
                Error loading folder: {error}
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-6 break-all">
                {currentPath.split(/[\\/]/).pop()}
            </h2>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
                {files.map((file) => (
                    <div
                        key={file.path}
                        onClick={() => handleItemClick(file)}
                        className="group flex flex-col items-center p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                        <div className="w-16 h-16 mb-3 flex items-center justify-center text-4xl text-[#B5BAC1] group-hover:text-white transition-colors">
                            {file.is_dir ? '📁' : '🎬'}
                        </div>
                        <div className="text-center w-full">
                            <div className="text-sm font-medium text-[#DBDEE1] truncate w-full group-hover:text-white">
                                {file.name}
                            </div>
                            {file.size && (
                                <div className="text-xs text-[#949BA4] mt-1">
                                    {(file.size / (1024 * 1024)).toFixed(1)} MB
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {files.length === 0 && (
                    <div className="col-span-full text-center text-[#949BA4] py-12">
                        No videos found in this folder.
                    </div>
                )}
            </div>
        </div>
    );
}

export default LocalFolder;
