'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isUsernameAvailable, claimUsername } from '@/lib/social';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, CheckCircle2, XCircle, AtSign, Sparkles } from 'lucide-react';

export default function OnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [checking, setChecking] = useState(false);
    const [available, setAvailable] = useState<boolean | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Debounced username check
    useEffect(() => {
        if (!username || username.length < 3) {
            setAvailable(null);
            return;
        }

        const timer = setTimeout(async () => {
            setChecking(true);
            try {
                const isAvail = await isUsernameAvailable(username);
                setAvailable(isAvail);
            } catch (e) {
                console.error('Error checking username:', e);
            } finally {
                setChecking(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [username]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !available) return;

        setSubmitting(true);
        setError('');

        try {
            // Ensure user document exists first
            const userRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                // Create user document if it doesn't exist
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    role: 'customer',
                    createdAt: new Date().toISOString()
                });
            }

            // Claim username
            await claimUsername(user.uid, username, bio);

            // Redirect to feed
            router.replace('/petbook');
        } catch (err: any) {
            console.error('Error claiming username:', err);
            setError(err.message || 'Failed to claim username. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const normalizedUsername = username.toLowerCase().trim();
    const isValidFormat = /^[a-z0-9_]+$/.test(normalizedUsername) && normalizedUsername.length >= 3;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#FF9F1C] to-[#FFBF69] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-100">
                        <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">Welcome to Petbook!</h1>
                    <p className="text-gray-500 mt-2">Choose your unique username to get started</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                    {/* Username Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <AtSign className="w-5 h-5" />
                            </span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                placeholder="your_username"
                                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] outline-none text-lg font-medium"
                                maxLength={20}
                                required
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2">
                                {checking ? (
                                    <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                                ) : available === true ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : available === false ? (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                ) : null}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            3-20 characters. Letters, numbers, and underscores only. This cannot be changed later.
                        </p>
                        {available === false && (
                            <p className="text-xs text-red-500 mt-1">This username is already taken.</p>
                        )}
                    </div>

                    {/* Bio Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Bio (Optional)</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about you and your pets..."
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] outline-none resize-none"
                            rows={3}
                            maxLength={150}
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/150</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting || !isValidFormat || !available}
                        className="w-full py-4 bg-gradient-to-r from-[#FF9F1C] to-[#FFBF69] text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-orange-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Creating Profile...</>
                        ) : (
                            'Continue'
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-6">
                    By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
