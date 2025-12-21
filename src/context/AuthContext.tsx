'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User as FirebaseUser,
    onAuthStateChanged,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
    user: FirebaseUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            setLoading(true);
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
    // Note: {!loading && children} might block the entire app while loading. 
    // For better UX, might want to show a spinner or allow public routes to render.
    // But per request "prevent flickering", blocking genericly or rendering a Loading component is best.
    // I will leave it as rendering nothing or children based on implemented logic. 
    // Actually, to truly prevent flickering of "Sign In" button, we need the loading state to be exposed to components,
    // or block rendering of protected routes. 
    // The user requested: "Add a loading state. This prevents the flickering 'Sign In' button..."
    // I will expose `loading` in value, and maybe render children always but let children decide? 
    // Or block? Blocking is safer for "flicker free" if the whole app depends on it. 
    // But usually we wrap the app.
    // If I return `loading ? <Loading/> : children` it handles it globally.
    // For now I'll just expose it and render children, but the user plan said "Add a loading state...".
    // I will stick to the standard pattern: expose loading, and maybe conditionally render if strictly needed, 
    // but usually components consume `loading` to decide what to show.
    // Wait, the plan check "prevent flickering...".
    // If I just render children, the `user` is null initially -> Login button shows -> then `user` populates -> Avatar shows. That IS the flicker.
    // So `loading` must be used.
    // I will modify the return to simply return children, but components use the hook.
    // OR, effectively, I can inhibit children which might be too aggressive.
    // I'll stick to exposing `loading`. 
    // Use `useAuth` hook in components to check `loading`.
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
