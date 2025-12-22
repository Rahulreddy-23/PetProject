'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Post, Comment } from '@/types/schema';
import { useAuth } from '@/context/AuthContext';
import { toggleLike, addComment, getCommentsForPost, deletePost } from '@/lib/petbook';
import { Heart, MessageCircle, Send, Trash2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
    post: Post;
    onDelete?: (postId: string) => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
    const { user } = useAuth();
    const [likes, setLikes] = useState<string[]>(post.likes || []);
    const [comments, setComments] = useState<Comment[]>([]);
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // VideoRefs
    const videoRef = useRef<HTMLVideoElement>(null);

    const isLiked = user ? likes.includes(user.uid) : false;
    const isOwner = user?.uid === post.userId;

    const handleLike = async () => {
        if (!user) return; // Or show login modal

        // Optimistic update
        const previousLikes = [...likes];
        if (isLiked) {
            setLikes(likes.filter(id => id !== user.uid));
        } else {
            setLikes([...likes, user.uid]);
        }

        try {
            await toggleLike(post.id, user.uid);
        } catch (error) {
            console.error("Failed to like post", error);
            setLikes(previousLikes); // Revert
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newComment.trim()) return;

        try {
            const commentData = {
                postId: post.id,
                userId: user.uid,
                userName: user.displayName || 'Anonymous',
                userPhoto: user.photoURL || null,
                text: newComment.trim()
            };

            const commentId = await addComment(commentData);

            setComments([...comments, { ...commentData, id: commentId, createdAt: new Date().toISOString() } as Comment]);
            setNewComment('');
        } catch (error) {
            console.error("Failed to add comment", error);
        }
    };

    const toggleComments = async () => {
        if (!showComments) {
            setLoadingComments(true);
            const fetchedComments = await getCommentsForPost(post.id);
            setComments(fetchedComments);
            setLoadingComments(false);
        }
        setShowComments(!showComments);
    };

    const handleDelete = async () => {
        if (!isOwner) return;
        if (!confirm("Are you sure you want to delete this post?")) return;

        setIsDeleting(true);
        try {
            await deletePost(post.id, user.uid, post.mediaUrl);
            if (onDelete) onDelete(post.id);
        } catch (error) {
            console.error("Failed to delete post", error);
            alert("Failed to delete post");
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm mb-6">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden relative border border-gray-100">
                        {post.authorPhoto ? (
                            <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <span className="text-xl">👤</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">{post.authorName}</h3>
                        {post.petId && (
                            <span className="text-xs text-gray-500 block">with a Pet 🐾</span>
                        )}
                    </div>
                </div>
                {isOwner && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Delete Post"
                    >
                        {isDeleting ? <span className="text-xs">Deleting...</span> : <Trash2 className="w-5 h-5" />}
                    </button>
                )}
            </div>

            {/* Media */}
            <div className="relative bg-black w-full" style={{ minHeight: '300px' }}>
                {post.mediaType === 'video' ? (
                    <video
                        ref={videoRef}
                        src={post.mediaUrl}
                        className="w-full h-auto max-h-[600px] object-contain mx-auto"
                        controls
                        playsInline
                        loop
                        muted
                    />
                ) : (
                    <img
                        src={post.mediaUrl}
                        alt="Post content"
                        loading="lazy"
                        className="w-full h-auto max-h-[600px] object-contain mx-auto"
                        width={post.mediaWidth}
                        height={post.mediaHeight}
                    />
                )}
            </div>

            {/* Actions */}
            <div className="p-4">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-2 transition-transform hover:scale-110 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
                    >
                        <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={toggleComments}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-transform hover:scale-110"
                    >
                        <MessageCircle className="w-7 h-7" />
                    </button>
                </div>

                {/* Likes Count */}
                {likes.length > 0 && (
                    <p className="font-bold text-gray-900 mb-2">{likes.length} likes</p>
                )}

                {/* Caption */}
                <div className="mb-2">
                    <span className="font-bold text-gray-900 mr-2">{post.authorName}</span>
                    <span className="text-gray-800">{post.caption}</span>
                </div>

                <p className="text-xs text-gray-400 uppercase tracking-wide mb-4">
                    {(() => {
                        try {
                            return formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
                        } catch (e) {
                            return 'Just now';
                        }
                    })()}
                </p>

                {/* Comments Section */}
                {showComments && (
                    <div className="border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-top-2">
                        <div className="max-h-60 overflow-y-auto space-y-3 mb-4 custom-scrollbar">
                            {loadingComments ? (
                                <p className="text-center text-gray-400 text-sm">Loading comments...</p>
                            ) : comments.length > 0 ? (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                                            {comment.userPhoto ? (
                                                <img src={comment.userPhoto} alt={comment.userName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-blue-50 flex items-center justify-center text-xs">👤</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm">
                                                <span className="font-bold text-gray-900 mr-2">{comment.userName}</span>
                                                <span className="text-gray-700">{comment.text}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-400 text-sm">No comments yet.</p>
                            )}
                        </div>

                        {/* Add Comment */}
                        <form onSubmit={handleCommentSubmit} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim()}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg disabled:opacity-50 font-bold"
                            >
                                Post
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
