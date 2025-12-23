'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { getQuestions, createQuestion, addAnswer, uploadQuestionImage } from '@/lib/petora';
import { Question, Pet } from '@/types/schema';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MessageSquare, ThumbsUp, Plus, Search, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

export default function PetoraFeed() {
    const { user } = useAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAskModalOpen, setIsAskModalOpen] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedPetId, setSelectedPetId] = useState('');
    const [pets, setPets] = useState<Pet[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Questions
    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const { questions: data } = await getQuestions();
            setQuestions(data);
        } catch (error) {
            console.error("Error fetching questions:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Pets for Dropdown & Questions on load
    useEffect(() => {
        if (user) {
            const fetchPets = async () => {
                const petsCol = collection(db, 'users', user.uid, 'pets');
                const snapshot = await getDocs(petsCol);
                setPets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pet)));
            };
            fetchPets();
            fetchQuestions(); // Only fetch if authenticated
        }
    }, [user]);

    // Set default pet if available
    useEffect(() => {
        if (pets.length > 0 && !selectedPetId) {
            setSelectedPetId(pets[0].id);
        }
    }, [pets]);

    const { getRootProps, getInputProps } = useDropzone({
        accept: { 'image/*': [] },
        maxFiles: 1,
        onDrop: (acceptedFiles) => setImageFile(acceptedFiles[0])
    });

    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedPetId) return;

        setIsSubmitting(true);
        try {
            // 1. Upload Image if any
            let imageUrl = '';
            if (imageFile) {
                imageUrl = await uploadQuestionImage(imageFile, user.uid);
            }

            // 2. Create Question
            const questionData = {
                userId: user.uid,
                authorName: user.displayName || 'Anonymous',
                authorPhoto: user.photoURL || null,
                petId: selectedPetId,
                title,
                content,
                imageUrl,
                tags: [] // Can add tag selector later
            };
            const questionId = await createQuestion(questionData);

            // 3. Close Modal & Refresh Feed
            setIsAskModalOpen(false);
            setTitle('');
            setContent('');
            setImageFile(null);
            fetchQuestions(); // Refresh UI immediately

            // 4. Trigger AI Answer (Async)
            // We do this in background to not block UI
            const selectedPet = pets.find(p => p.id === selectedPetId);

            // Fire and wait
            const aiRes = await fetch('/api/petora/ai-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questionId,
                    questionTitle: title,
                    questionContent: content,
                    petDetails: selectedPet
                })
            });

            if (aiRes.ok) {
                const { answer } = await aiRes.json();
                if (answer) {
                    await addAnswer({
                        questionId,
                        userId: 'AI_ASSISTANT', // Special ID
                        authorName: 'Petora AI',
                        authorPhoto: null, // Can add a bot icon url here
                        content: answer,
                        isAiGenerated: true
                    });
                }
            }

        } catch (error) {
            console.error("Error creating question:", error);
            alert("Failed to post question.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 py-8 px-4">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Petora</h1>
                        <p className="text-gray-500 mt-1">Ask questions, share advice, and get AI insights.</p>
                    </div>
                    <button
                        onClick={() => setIsAskModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[#FF9F1C] text-white rounded-xl font-bold hover:bg-orange-500 transition shadow-lg shadow-orange-100"
                    >
                        <Plus className="w-5 h-5" />
                        Ask Question
                    </button>
                </div>
            </div>

            {/* Feed */}
            <div className="max-w-4xl mx-auto px-4 mt-8 space-y-6">
                {loading ? (
                    <div className="text-center py-20 text-gray-400">Loading discussion...</div>
                ) : questions.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="bg-white p-6 rounded-full inline-block mb-4 shadow-sm">
                            <MessageSquare className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">No questions yet</h3>
                        <p className="text-gray-500">Be the first to ask for advice!</p>
                    </div>
                ) : (
                    questions.map(q => (
                        <Link href={`/petora/${q.id}`} key={q.id} className="block group">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-blue-100">
                                <div className="flex items-start justify-between">
                                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors mb-2">
                                        {q.title}
                                    </h3>
                                    {q.imageUrl && (
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 ml-4">
                                            <img src={q.imageUrl} alt="Attachment" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-600 line-clamp-2 mb-4">{q.content}</p>

                                <div className="flex items-center gap-6 text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                            {q.authorName[0]}
                                        </div>
                                        <span>{q.authorName}</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>{q.answerCount || 0} Answers</span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <ThumbsUp className="w-4 h-4" />
                                        <span>{q.upvotes?.length || 0}</span>
                                    </div>

                                    <div className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded-full">
                                        {new Date(q.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* Ask Modal */}
            {isAskModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-gray-800">Ask the Community</h2>
                            <button onClick={() => setIsAskModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleAskQuestion} className="p-6 space-y-6">
                            {/* Pet Selector */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Which pet is this about?</label>
                                {pets.length > 0 ? (
                                    <select
                                        value={selectedPetId}
                                        onChange={(e) => setSelectedPetId(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] outline-none"
                                        required
                                    >
                                        {pets.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.species})</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                                        You need to add a pet profile first.
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Question Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Why is my dog sneezing?"
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] outline-none font-medium"
                                    required
                                />
                            </div>

                            {/* Content */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Details</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Describe symptoms, duration, or context..."
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] outline-none min-h-[150px]"
                                    required
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Add Photo (Optional)</label>
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                                        ${imageFile ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                                >
                                    <input {...getInputProps()} />
                                    {imageFile ? (
                                        <div className="flex items-center justify-center gap-2 text-blue-600">
                                            <ImageIcon className="w-5 h-5" />
                                            <span className="font-medium truncate max-w-xs">{imageFile.name}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setImageFile(null); }}
                                                className="ml-2 hover:bg-blue-100 p-1 rounded-full"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500">
                                            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                            <p className="text-sm">Click or drag image to attach</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !user || !selectedPetId}
                                    className="flex items-center gap-2 px-8 py-3 bg-[#FF9F1C] text-white rounded-xl font-bold hover:bg-orange-500 disabled:opacity-50 transition"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Posting...</>
                                    ) : 'Post Question'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
