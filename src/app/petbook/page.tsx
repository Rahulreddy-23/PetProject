'use client';

import React, { useEffect, useState } from 'react';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import { getPosts } from '@/lib/petbook';
import { Post } from '@/types/schema';
import { Loader2, RefreshCw } from 'lucide-react';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export default function PetbookPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const fetchInitialPosts = async () => {
        setLoading(true);
        try {
            const { posts: fetchedPosts, lastVisible } = await getPosts(undefined, 5);
            setPosts(fetchedPosts);
            setLastDoc(lastVisible);
            setHasMore(fetchedPosts.length === 5);
        } catch (error) {
            console.error("Failed to load posts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialPosts();
    }, []);

    const loadMorePosts = async () => {
        if (!lastDoc || loadingMore) return;
        setLoadingMore(true);
        try {
            const { posts: newPosts, lastVisible } = await getPosts(lastDoc, 5);
            setPosts(prev => [...prev, ...newPosts]);
            setLastDoc(lastVisible);
            setHasMore(newPosts.length === 5);
        } catch (error) {
            console.error("Failed to load more posts", error);
        } finally {
            setLoadingMore(false);
        }
    };

    const handlePostCreated = () => {
        // Refresh feed or prepend
        // Prepend might be tricky if pagination is strict, but usually fine for simple feeds.
        // Or just re-fetch everything. Re-fetching is safer for sync.
        fetchInitialPosts();
    };

    const handleDeletePost = (postId: string) => {
        setPosts(prev => prev.filter(p => p.id !== postId));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-xl mx-auto px-4">

                {/* Header / Branding */}
                <div className="flex items-center justify-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FF9F1C] to-[#FFBF69] bg-clip-text text-transparent">
                        Petbook
                    </h1>
                </div>

                {/* Create Post Widget */}
                <CreatePost onPostCreated={handlePostCreated} />

                {/* Feed */}
                <div className="space-y-6">
                    {loading ? (
                        // Initial Skeleton Loading
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

                            {/* Load More Trigger */}
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
                            <p className="text-xl">No posts yet.</p>
                            <p>Be the first to share your pet!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
