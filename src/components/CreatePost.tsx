'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { uploadMultipleMedia, createPost } from '@/lib/petbook';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pet, PostVisibility } from '@/types/schema';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, Video, X, Loader2, Globe, Users, Lock, ChevronLeft, ChevronRight } from 'lucide-react';

interface CreatePostProps {
    onPostCreated: () => void;
}

const TAGS = ['funny', 'cute', 'training', 'health', 'food', 'adventure', 'grooming', 'rescue'];

export default function CreatePost({ onPostCreated }: CreatePostProps) {
    const { user } = useAuth();
    const [caption, setCaption] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [currentPreview, setCurrentPreview] = useState(0);
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<string>('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [visibility, setVisibility] = useState<PostVisibility>('public');
    const [loading, setLoading] = useState(false);
    const [userUsername, setUserUsername] = useState('');

    // Fetch Pets & Username
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Fetch pets
                const petsCol = collection(db, 'users', user.uid, 'pets');
                const snapshot = await getDocs(petsCol);
                const fetchedPets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pet));
                setPets(fetchedPets);

                // Fetch username
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setUserUsername(userDoc.data().username || '');
                }
            } catch (error) {
                console.error("Error fetching data", error);
            }
        };
        fetchData();
    }, [user]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = [...files, ...acceptedFiles].slice(0, 5); // Max 5 files
        setFiles(newFiles);

        // Create preview URLs
        const urls = newFiles.map(f => URL.createObjectURL(f));
        setPreviewUrls(urls);
        setCurrentPreview(0);
    }, [files]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': [],
            'video/*': []
        },
        maxFiles: 5,
        multiple: true
    });

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        const newUrls = previewUrls.filter((_, i) => i !== index);
        setFiles(newFiles);
        setPreviewUrls(newUrls);
        if (currentPreview >= newFiles.length) {
            setCurrentPreview(Math.max(0, newFiles.length - 1));
        }
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

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || files.length === 0) return;

        setLoading(true);
        try {
            // 1. Get Dimensions of first image
            const { width, height } = await getDimensions(files[0]);

            // 2. Upload all media
            const mediaUrls = await uploadMultipleMedia(files, user.uid);

            // 3. Determine media type
            const hasVideo = files.some(f => f.type.startsWith('video'));
            const mediaType = hasVideo ? 'video' : (files.length > 1 ? 'carousel' : 'image');

            // 4. Create Post
            await createPost({
                userId: user.uid,
                authorName: user.displayName || 'Anonymous',
                authorPhoto: user.photoURL || null,
                authorUsername: userUsername,
                mediaUrls,
                mediaType,
                mediaWidth: width,
                mediaHeight: height,
                caption,
                visibility,
                tags: selectedTags,
                petId: selectedPetId || undefined,
            });

            // Reset
            setCaption('');
            setFiles([]);
            setPreviewUrls([]);
            setSelectedPetId('');
            setSelectedTags([]);
            setVisibility('public');
            onPostCreated();
        } catch (error) {
            console.error("Error creating post", error);
            alert("Failed to create post. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const VisibilityIcon = visibility === 'public' ? Globe : visibility === 'friends' ? Users : Lock;

    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Post</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Media Upload Area */}
                {files.length === 0 ? (
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
                        <p className="text-sm text-gray-400 mt-1">Up to 5 images for carousel</p>
                    </div>
                ) : (
                    <div className="relative rounded-2xl overflow-hidden bg-black">
                        {/* Carousel Preview */}
                        <div className="relative aspect-square max-h-[400px]">
                            {files[currentPreview]?.type.startsWith('video') ? (
                                <video
                                    src={previewUrls[currentPreview]}
                                    controls
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <img
                                    src={previewUrls[currentPreview]}
                                    alt="Preview"
                                    className="w-full h-full object-contain"
                                />
                            )}

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={() => removeFile(currentPreview)}
                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Carousel Navigation */}
                            {files.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPreview(p => Math.max(0, p - 1))}
                                        disabled={currentPreview === 0}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full disabled:opacity-30"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPreview(p => Math.min(files.length - 1, p + 1))}
                                        disabled={currentPreview === files.length - 1}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full disabled:opacity-30"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    {/* Dots */}
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {files.map((_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setCurrentPreview(i)}
                                                className={`w-2 h-2 rounded-full transition ${i === currentPreview ? 'bg-white' : 'bg-white/50'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Add More Button */}
                        {files.length < 5 && (
                            <div {...getRootProps()} className="p-2 bg-gray-900/50 text-center cursor-pointer hover:bg-gray-900/70">
                                <input {...getInputProps()} />
                                <p className="text-white text-sm">+ Add more ({files.length}/5)</p>
                            </div>
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

                {/* Tags */}
                <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-2">Tags</label>
                    <div className="flex flex-wrap gap-2">
                        {TAGS.map(tag => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1 rounded-full text-sm font-medium transition
                                    ${selectedTags.includes(tag)
                                        ? 'bg-[#A2D2FF] text-blue-800'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                #{tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pet Selector */}
                {pets.length > 0 && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-600 mb-2">Tag a Pet (Optional)</label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
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

                {/* Visibility & Submit Row */}
                <div className="flex items-center justify-between pt-2">
                    {/* Visibility Selector */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setVisibility('public')}
                            className={`p-2 rounded-full transition ${visibility === 'public' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                            title="Public"
                        >
                            <Globe className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setVisibility('friends')}
                            className={`p-2 rounded-full transition ${visibility === 'friends' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
                            title="Friends Only"
                        >
                            <Users className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setVisibility('private')}
                            className={`p-2 rounded-full transition ${visibility === 'private' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-400'}`}
                            title="Private"
                        >
                            <Lock className="w-5 h-5" />
                        </button>
                        <span className="text-xs text-gray-400 ml-2 capitalize">{visibility}</span>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || files.length === 0}
                        className="flex items-center gap-2 px-8 py-3 bg-[#FF9F1C] text-white rounded-xl font-bold hover:bg-orange-500 shadow-lg shadow-orange-100 transition disabled:opacity-50"
                    >
                        {loading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Posting...</>
                        ) : (
                            'Share Post'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
