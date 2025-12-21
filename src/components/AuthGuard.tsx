'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading && !user && pathname !== '/login') {
            router.push('/login');
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-white">
                <Loader2 className="w-10 h-10 text-[#FF9F1C] animate-spin" />
            </div>
        );
    }

    // If on login page, or user exists, render children
    // (We handled redirect above for !user && !login)
    return <>{children}</>;
}
