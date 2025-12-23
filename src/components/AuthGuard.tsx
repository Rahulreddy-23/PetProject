'use client';

import React, { useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: ReactNode;
}

const PUBLIC_ROUTES = ['/login', '/'];
const ONBOARDING_ROUTE = '/onboarding';

export default function AuthGuard({ children }: AuthGuardProps) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [checking, setChecking] = useState(true);
    const [hasUsername, setHasUsername] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            // Wait for auth to resolve
            if (authLoading) return;

            // Public routes don't need checks
            if (PUBLIC_ROUTES.includes(pathname)) {
                setChecking(false);
                return;
            }

            // Not logged in -> redirect to login
            if (!user) {
                router.replace('/login');
                return;
            }

            // Already on onboarding -> allow
            if (pathname === ONBOARDING_ROUTE) {
                setChecking(false);
                return;
            }

            // Check if user has username
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.username) {
                        setHasUsername(true);
                        setChecking(false);
                        return;
                    }
                }
                // No username -> redirect to onboarding
                router.replace(ONBOARDING_ROUTE);
            } catch (error) {
                console.error('Error checking user profile:', error);
                setChecking(false);
            }
        };

        checkUser();
    }, [user, authLoading, pathname, router]);

    // Show loading while checking
    if (authLoading || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-[#FF9F1C] animate-spin" />
                    <p className="text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Public routes or authenticated with username
    if (PUBLIC_ROUTES.includes(pathname) || pathname === ONBOARDING_ROUTE || hasUsername) {
        return <>{children}</>;
    }

    // Fallback loading (shouldn't normally reach here)
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 text-[#FF9F1C] animate-spin" />
        </div>
    );
}
