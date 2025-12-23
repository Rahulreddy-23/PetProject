'use client';

import React, { useEffect, useState } from 'react';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import SuggestedUsers from '@/components/SuggestedUsers';
import { getPosts } from '@/lib/petbook';
import { Post } from '@/types/schema';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';

export default function PetbookPage() {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchInitialPosts = async () => {
        setLoading(true);
        try {
            const { posts: fetchedPosts, lastVisible } = await getPosts(undefined, 10);
            setPosts(fetchedPosts);
            setLastDoc(lastVisible);
            setHasMore(fetchedPosts.length === 10);
        } catch (error) {
            console.error("Failed to load posts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchInitialPosts();
        }
    }, [user]);

    const loadMorePosts = async () => {
        if (!lastDoc || loadingMore) return;
        setLoadingMore(true);
        try {
            const { posts: newPosts, lastVisible } = await getPosts(lastDoc, 10);
            setPosts(prev => [...prev, ...newPosts]);
            setLastDoc(lastVisible);
            setHasMore(newPosts.length === 10);
        } catch (error) {
            console.error("Failed to load more posts", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handlePostCreated = () => {
        fetchInitialPosts();
    };

    const handleDeletePost = (postId: string) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FF9F1C] to-[#FFBF69] bg-clip-text text-transparent">
                            Petbook
                        </h1>
                        <Sparkles className="w-5 h-5 text-[#FF9F1C]" />
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="max-w-5xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Create Post Widget */}
                        <CreatePost onPostCreated={handlePostCreated} />

                        {/* Feed */}
                        {loading ? (
                            // Skeleton Loading
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm h-96 animate-pulse">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                    </div>
                                    <div className="bg-gray-200 w-full h-64 rounded-xl mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))
                        ) : posts.length > 0 ? (
                            <>
                                {posts.map(post => (
                                    <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
                                ))}

                                {/* Load More */}
                                {hasMore ? (
                                    <div className="flex justify-center pt-4 pb-8">
                                        <button
                                            onClick={loadMorePosts}
                                            disabled={loadingMore}
                                            className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-full text-gray-600 font-medium hover:bg-gray-50 shadow-sm disabled:opacity-50"
                                        >
                                            {loadingMore ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                                            {loadingMore ? 'Loading...' : 'Load More'}
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-400 pb-8 text-sm">You've seen it all! 🐾</p>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">🐾</span>
                                </div>
                                <p className="text-xl font-bold text-gray-700">No posts yet.</p>
                                <p className="text-gray-500 mt-1">Be the first to share your pet!</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="hidden lg:block space-y-6">
                        {/* User Card */}
                        {user && (
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-blue-100 overflow-hidden">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xl">
                                                {user.displayName?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{user.displayName}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Suggested Users */}
                        <SuggestedUsers />

                        {/* Footer */}
                        <div className="text-xs text-gray-400 space-y-1">
                            <p>Made with love for pets.</p>
                            <p className="flex gap-2">
                                <a href="#" className="hover:underline">About</a>
                                <a href="#" className="hover:underline">Help</a>
                                <a href="#" className="hover:underline">Privacy</a>
                                <a href="#" className="hover:underline">Terms</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
