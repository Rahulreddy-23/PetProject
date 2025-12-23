'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getSuggestedUsers, followUser, isFollowing } from '@/lib/social';
import { User } from '@/types/schema';
import { UserPlus, Check, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function SuggestedUsers() {
    const { user } = useAuth();
    const [suggestions, setSuggestions] = useState<Partial<User>[]>([]);
    const [loading, setLoading] = useState(true);
    const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
    const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!user) return;

            try {
                const users = await getSuggestedUsers(user.uid, 5);
                setSuggestions(users);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [user]);

    const handleFollow = async (targetUid: string) => {
        if (!user) return;

        setFollowLoading(prev => ({ ...prev, [targetUid]: true }));

        try {
            await followUser(user.uid, targetUid);
            setFollowingStatus(prev => ({ ...prev, [targetUid]: true }));
            // Remove from suggestions after following
            setTimeout(() => {
                setSuggestions(prev => prev.filter(u => u.uid !== targetUid));
            }, 1000);
        } catch (error) {
            console.error('Error following user:', error);
        } finally {
            setFollowLoading(prev => ({ ...prev, [targetUid]: false }));
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                                <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-600 mb-4">Suggested for you</h3>

            <div className="space-y-3">
                {suggestions.map(suggestedUser => (
                    <div key={suggestedUser.uid} className="flex items-center gap-3">
                        <Link href={`/profile/${suggestedUser.username}`} className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-blue-100 overflow-hidden">
                                {suggestedUser.photoURL ? (
                                    <img
                                        src={suggestedUser.photoURL}
                                        alt={suggestedUser.displayName || ''}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-lg">
                                        {suggestedUser.displayName?.[0]?.toUpperCase() || '?'}
                                    </div>
                                )}
                            </div>
                        </Link>

                        <div className="flex-1 min-w-0">
                            <Link href={`/profile/${suggestedUser.username}`}>
                                <p className="font-bold text-gray-900 text-sm truncate hover:underline">
                                    {suggestedUser.displayName || 'User'}
                                </p>
                            </Link>
                            <p className="text-xs text-gray-500 truncate">@{suggestedUser.username}</p>
                        </div>

                        <button
                            onClick={() => handleFollow(suggestedUser.uid!)}
                            disabled={followLoading[suggestedUser.uid!] || followingStatus[suggestedUser.uid!]}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition
                                ${followingStatus[suggestedUser.uid!]
                                    ? 'bg-gray-100 text-gray-500'
                                    : 'bg-[#FF9F1C] text-white hover:bg-orange-500'}`}
                        >
                            {followLoading[suggestedUser.uid!] ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : followingStatus[suggestedUser.uid!] ? (
                                <><Check className="w-3 h-3" /> Following</>
                            ) : (
                                <><UserPlus className="w-3 h-3" /> Follow</>
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
