'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { searchUsersByUsername, followUser, isFollowing } from '@/lib/social';
import { User } from '@/types/schema';
import { Search, UserPlus, Check, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Partial<User>[]>([]);
    const [searching, setSearching] = useState(false);
    const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});
    const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

    // Debounced search
    useEffect(() => {
        if (!query || query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const users = await searchUsersByUsername(query, 20);
                // Filter out current user
                setResults(users.filter(u => u.uid !== user?.uid));

                // Check follow status for each result
                if (user) {
                    const statuses: Record<string, boolean> = {};
                    for (const u of users) {
                        if (u.uid && u.uid !== user.uid) {
                            statuses[u.uid] = await isFollowing(user.uid, u.uid);
                        }
                    }
                    setFollowingStatus(statuses);
                }
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, user]);

    const handleFollow = async (targetUid: string) => {
        if (!user) return;

        setFollowLoading(prev => ({ ...prev, [targetUid]: true }));

        try {
            await followUser(user.uid, targetUid);
            setFollowingStatus(prev => ({ ...prev, [targetUid]: true }));
        } catch (error) {
            console.error('Error following user:', error);
        } finally {
            setFollowLoading(prev => ({ ...prev, [targetUid]: false }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/petbook" className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by username..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A2D2FF]"
                            autoFocus
                        />
                        {searching && (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                        )}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="max-w-2xl mx-auto px-4 py-6">
                {query.length < 2 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Type at least 2 characters to search</p>
                    </div>
                ) : results.length === 0 && !searching ? (
                    <div className="text-center py-20 text-gray-400">
                        <p className="text-lg font-medium text-gray-600">No users found</p>
                        <p className="text-sm mt-1">Try a different username</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {results.map(resultUser => (
                            <div
                                key={resultUser.uid}
                                className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 hover:shadow-sm transition"
                            >
                                <Link href={`/profile/${resultUser.username}`} className="flex-shrink-0">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-blue-100 overflow-hidden">
                                        {resultUser.photoURL ? (
                                            <img
                                                src={resultUser.photoURL}
                                                alt={resultUser.displayName || ''}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">
                                                {resultUser.displayName?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                </Link>

                                <div className="flex-1 min-w-0">
                                    <Link href={`/profile/${resultUser.username}`}>
                                        <p className="font-bold text-gray-900 truncate hover:underline">
                                            {resultUser.displayName || 'User'}
                                        </p>
                                    </Link>
                                    <p className="text-sm text-gray-500 truncate">@{resultUser.username}</p>
                                    {resultUser.bio && (
                                        <p className="text-xs text-gray-400 truncate mt-1">{resultUser.bio}</p>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleFollow(resultUser.uid!)}
                                    disabled={followLoading[resultUser.uid!] || followingStatus[resultUser.uid!]}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition
                                        ${followingStatus[resultUser.uid!]
                                            ? 'bg-gray-100 text-gray-500'
                                            : 'bg-[#FF9F1C] text-white hover:bg-orange-500'}`}
                                >
                                    {followLoading[resultUser.uid!] ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : followingStatus[resultUser.uid!] ? (
                                        <><Check className="w-4 h-4" /> Following</>
                                    ) : (
                                        <><UserPlus className="w-4 h-4" /> Follow</>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
