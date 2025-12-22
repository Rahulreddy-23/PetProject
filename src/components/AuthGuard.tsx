'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    // const [checkingProfile, setCheckingProfile] = useState(true);

    useEffect(() => {
        /*
        const checkProfile = async () => {
             // ... Logic commented out ...
        };
        */

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

    return <>{children}</>;
}
