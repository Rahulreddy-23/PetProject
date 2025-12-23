'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { User, Pet } from '@/types/schema';
import { Loader2, Plus, LogOut, Save, UserCircle, AtSign, Settings, Camera, Users, Heart } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState<Partial<User>>({});
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddPet, setShowAddPet] = useState(false);
    const [newPet, setNewPet] = useState<Partial<Pet>>({ species: 'Dog', breed: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                const userDocRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists()) {
                    setProfile(userSnap.data() as User);
                } else {
                    setProfile({
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        role: 'customer',
                        followersCount: 0,
                        followingCount: 0
                    });
                }

                const petsCol = collection(db, 'users', user.uid, 'pets');
                const querySnapshot = await getDocs(petsCol);
                const fetchedPets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pet));
                setPets(fetchedPets);

            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user]);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { ...profile, updatedAt: new Date().toISOString() }, { merge: true });
            alert("Profile Saved!");
        } catch (e) {
            console.error("Error saving profile", e);
            alert("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const handleAddPet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const petData = {
                ...newPet,
                ownerId: user.uid,
                weightTracker: [],
                upcomingReminders: [],
                createdAt: new Date().toISOString()
            };
            const petsCol = collection(db, 'users', user.uid, 'pets');
            const docRef = await addDoc(petsCol, petData);

            setPets(prev => [...prev, { ...petData, id: docRef.id } as Pet]);
            setShowAddPet(false);
            setNewPet({ species: 'Dog', breed: '' });
        } catch (e) {
            console.error("Error adding pet", e);
            alert("Failed to add pet");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="animate-spin text-[#FF9F1C] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">

            {/* Profile Header Card */}
            <div className="bg-gradient-to-br from-[#FF9F1C] to-[#FFBF69] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-32 h-32 border-4 border-white rounded-full" />
                    <div className="absolute bottom-5 left-5 w-20 h-20 border-4 border-white rounded-full" />
                </div>

                <div className="relative flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar */}
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/20 backdrop-blur-sm overflow-hidden border-4 border-white/30 flex-shrink-0">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">
                                {profile.displayName?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold">{profile.fullName || profile.displayName || 'Pet Lover'}</h1>
                        {profile.username && (
                            <p className="flex items-center justify-center md:justify-start gap-1 text-white/80 mt-1">
                                <AtSign className="w-4 h-4" />
                                {profile.username}
                            </p>
                        )}
                        {profile.bio && (
                            <p className="text-white/80 mt-2 text-sm max-w-md">{profile.bio}</p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-center md:justify-start gap-6 mt-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold">{pets.length}</p>
                                <p className="text-xs text-white/70">Pets</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">{profile.followersCount || 0}</p>
                                <p className="text-xs text-white/70">Followers</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold">{profile.followingCount || 0}</p>
                                <p className="text-xs text-white/70">Following</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition font-medium"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Personal Details Form */}
            <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-50 p-2.5 rounded-xl">
                        <UserCircle className="w-5 h-5 text-[#A2D2FF]" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Personal Details</h2>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] focus:border-transparent outline-none transition"
                                placeholder="John Doe"
                                value={profile.fullName || profile.displayName || ''}
                                onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Phone Number</label>
                            <input
                                type="tel"
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] focus:border-transparent outline-none transition"
                                placeholder="+91 98765 43210"
                                value={profile.phoneNumber || ''}
                                onChange={e => setProfile({ ...profile, phoneNumber: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Bio</label>
                            <textarea
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] focus:border-transparent outline-none transition resize-none"
                                placeholder="Tell us about you and your pets..."
                                rows={2}
                                value={profile.bio || ''}
                                onChange={e => setProfile({ ...profile, bio: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Address</label>
                            <input
                                type="text"
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] focus:border-transparent outline-none transition"
                                placeholder="123 Pet Street, Chennai"
                                value={profile.address || ''}
                                onChange={e => setProfile({ ...profile, address: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-3 bg-[#FF9F1C] text-white rounded-xl font-bold hover:bg-orange-500 shadow-lg shadow-orange-100 transition disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Profile
                        </button>
                    </div>
                </form>
            </section>

            {/* Pet Management */}
            <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2.5 rounded-xl">
                            <Heart className="w-5 h-5 text-green-500" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-800">Your Pets</h2>
                    </div>
                    <button
                        onClick={() => setShowAddPet(!showAddPet)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl font-bold hover:bg-green-100 transition"
                    >
                        <Plus className="w-4 h-4" /> Add Pet
                    </button>
                </div>

                {showAddPet && (
                    <form onSubmit={handleAddPet} className="mb-6 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input
                                type="text" placeholder="Pet Name" required
                                className="p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-green-200 outline-none"
                                value={newPet.name || ''}
                                onChange={e => setNewPet({ ...newPet, name: e.target.value })}
                            />
                            <select
                                className="p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-green-200 outline-none"
                                value={newPet.species || 'Dog'}
                                onChange={e => setNewPet({ ...newPet, species: e.target.value })}
                            >
                                <option value="Dog">🐕 Dog</option>
                                <option value="Cat">🐈 Cat</option>
                                <option value="Bird">🐦 Bird</option>
                                <option value="Other">🐾 Other</option>
                            </select>
                            <input
                                type="text" placeholder="Breed" required
                                className="p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-green-200 outline-none"
                                value={newPet.breed || ''}
                                onChange={e => setNewPet({ ...newPet, breed: e.target.value })}
                            />
                            <input
                                type="date" required
                                className="p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-green-200 outline-none"
                                value={newPet.birthDate || ''}
                                onChange={e => setNewPet({ ...newPet, birthDate: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowAddPet(false)} className="px-4 py-2 text-gray-500 font-medium">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600">Save Pet</button>
                        </div>
                    </form>
                )}

                {pets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-blue-100 rounded-full flex items-center justify-center text-3xl mb-4">🐶</div>
                        <p className="font-medium text-gray-600">No pets added yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Add your first pet to get started!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pets.map(pet => (
                            <div key={pet.id} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-2xl hover:shadow-md transition group">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    {pet.species === 'Dog' ? '🐕' : pet.species === 'Cat' ? '🐈' : pet.species === 'Bird' ? '🐦' : '🐾'}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800">{pet.name}</h3>
                                    <p className="text-sm text-gray-500">{pet.breed}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

        </div>
    );
}
