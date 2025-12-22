'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { uploadMedia, createPost } from '@/lib/petbook';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pet } from '@/types/schema';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, Video, X, Loader2 } from 'lucide-react';

interface CreatePostProps {
    onPostCreated: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
    const { user } = useAuth();
    const [caption, setCaption] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // Simple fake progress or could leverage upload task
    const [dragActive, setDragActive] = useState(false);

    // Fetch Pets
    useEffect(() => {
        const fetchPets = async () => {
            if (!user) return;
            try {
                const petsCol = collection(db, 'users', user.uid, 'pets');
                const snapshot = await getDocs(petsCol);
                const fetchedPets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pet));
                setPets(fetchedPets);
            } catch (error) {
                console.error("Error fetching pets", error);
            }
        };
        fetchPets();
    }, [user]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.length > 0) {
            const selectedFile = acceptedFiles[0];
            const type = selectedFile.type.startsWith('video') ? 'video' : 'image';

            setFile(selectedFile);
            setFileType(type);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'video/*': []
        },
        maxFiles: 1,
        multiple: false
    });

    const removeFile = () => {
        setFile(null);
        setFileType(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    const getDimensions = (file: File): Promise<{ width: number, height: number }> => {
        return new Promise((resolve) => {
            if (file.type.startsWith('video')) {
                const video = document.createElement('video');
                video.preload = 'metadata';
                video.onloadedmetadata = () => {
                    resolve({ width: video.videoWidth, height: video.videoHeight });
                };
                video.onerror = () => resolve({ width: 0, height: 0 });
                video.src = URL.createObjectURL(file);
            } else {
                const img = new Image();
                img.onload = () => {
                    resolve({ width: img.width, height: img.height });
                };
                img.onerror = () => resolve({ width: 0, height: 0 });
                img.src = URL.createObjectURL(file);
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !file || !fileType) return;

        setLoading(true);
        try {
            // 1. Get Dimensions
            const { width, height } = await getDimensions(file);

            // 2. Upload Media
            const downloadUrl = await uploadMedia(file, user.uid);

            // 3. Create Post
            await createPost({
                userId: user.uid,
                authorName: user.displayName || 'Anonymous',
                authorPhoto: user.photoURL || null,
                mediaUrl: downloadUrl,
                mediaType: fileType,
                mediaWidth: width,
                mediaHeight: height,
                caption: caption,
                petId: selectedPetId || undefined,
            });

            // Reset
            setCaption('');
            removeFile();
            setSelectedPetId('');
            onPostCreated();
        } catch (error) {
            console.error("Error creating post", error);
            alert("Failed to create post. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Post</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Media Upload Area */}
                {!file ? (
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors
                            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                    >
                        <input {...getInputProps()} />
                        <div className="flex gap-4 mb-3 text-[#A2D2FF]">
                            <ImageIcon className="w-8 h-8" />
                            <Video className="w-8 h-8" />
                        </div>
                        <p className="text-gray-500 font-medium">Drag & drop photos or videos here</p>
                        <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                    </div>
                ) : (
                    <div className="relative rounded-2xl overflow-hidden bg-black max-h-[400px]">
                        <button
                            type="button"
                            onClick={removeFile}
                            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {fileType === 'video' ? (
                            <video src={previewUrl!} controls className="w-full h-full object-contain mx-auto max-h-[400px]" />
                        ) : (
                            <img src={previewUrl!} alt="Preview" className="w-full h-full object-contain mx-auto max-h-[400px]" />
                        )}
                    </div>
                )}

                {/* Caption */}
                <div>
                    <textarea
                        placeholder="Write a caption..."
                        rows={3}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] outline-none resize-none"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                    />
                </div>

                {/* Pet Selector */}
                {pets.length > 0 && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Tag a Pet (Optional)</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {pets.map(pet => (
                                <button
                                    key={pet.id}
                                    type="button"
                                    onClick={() => setSelectedPetId(selectedPetId === pet.id ? '' : pet.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition whitespace-nowrap
                                        ${selectedPetId === pet.id
                                            ? 'bg-blue-50 border-blue-200 text-blue-600 ring-1 ring-blue-200'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <span>{pet.species === 'Dog' ? '🐕' : pet.species === 'Cat' ? '🐈' : '🐾'}</span>
                                    <span className="font-medium">{pet.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        disabled={loading || !file}
                        className="flex items-center gap-2 px-8 py-3 bg-[#FF9F1C] text-white rounded-xl font-bold hover:bg-orange-500 shadow-lg shadow-orange-100 transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Posting your cute pet...
                            </>
                        ) : (
                            'Share Post'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
