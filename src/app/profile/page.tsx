'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { User, Pet } from '@/types/schema';
import { Loader2, Plus, LogOut, Save, UserCircle } from 'lucide-react';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [profile, setProfile] = useState<Partial<User>>({});
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddPet, setShowAddPet] = useState(false);
    const [newPet, setNewPet] = useState<Partial<Pet>>({ species: 'Dog', breed: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            try {
                // 1. Fetch User Profile
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
                        role: 'customer'
                    });
                }

                // 2. Fetch Pets from Subcollection
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

        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { ...profile, updatedAt: new Date().toISOString() }, { merge: true });
            alert("Profile Saved!");
        } catch (e) {
            console.error("Error saving profile", e);
            alert("Failed to save profile");
        }
    };

    const handleAddPet = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const petData = {
                ...newPet,
                ownerId: user.uid, // Keep explicit ownerId just in case
                weightTracker: [],
                upcomingReminders: [],
                createdAt: new Date().toISOString()
            };
            // Add to Subcollection
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

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-[#A2D2FF] w-10 h-10" /></div>;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-10">

            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Your Account</h1>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition"
                >
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>

            {/* Profile Logic */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-blue-50 p-3 rounded-full">
                        <UserCircle className="w-6 h-6 text-[#A2D2FF]" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Personal Details</h2>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 bg-blue-50/30 border border-blue-100 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] outline-none transition"
                                placeholder="John Doe"
                                value={profile.fullName || profile.displayName || ''}
                                onChange={e => setProfile({ ...profile, fullName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Phone Number</label>
                            <input
                                type="tel"
                                required
                                className="w-full p-3 bg-blue-50/30 border border-blue-100 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] outline-none transition"
                                placeholder="+1 234 567 890"
                                value={profile.phoneNumber || ''}
                                onChange={e => setProfile({ ...profile, phoneNumber: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-600 mb-2">Address</label>
                            <input
                                type="text"
                                required
                                className="w-full p-3 bg-blue-50/30 border border-blue-100 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] outline-none transition"
                                placeholder="123 Pet Street"
                                value={profile.address || ''}
                                onChange={e => setProfile({ ...profile, address: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-[#FF9F1C] text-white rounded-xl font-bold hover:bg-orange-500 shadow-sm transition transform hover:-translate-y-0.5">
                            <Save className="w-4 h-4" /> Save Profile
                        </button>
                    </div>
                </form>
            </section>

            {/* Pet Management */}
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Your Pets</h2>
                    <button
                        onClick={() => setShowAddPet(!showAddPet)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full font-bold hover:bg-green-100 transition"
                    >
                        <Plus className="w-4 h-4" /> Add Pet
                    </button>
                </div>

                {showAddPet && (
                    <form onSubmit={handleAddPet} className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input
                                type="text" placeholder="Pet Name" required
                                className="p-3 border border-gray-200 rounded-xl"
                                value={newPet.name || ''}
                                onChange={e => setNewPet({ ...newPet, name: e.target.value })}
                            />
                            <select
                                className="p-3 border border-gray-200 rounded-xl bg-white"
                                value={newPet.species || 'Dog'}
                                onChange={e => setNewPet({ ...newPet, species: e.target.value })}
                            >
                                <option value="Dog">Dog</option>
                                <option value="Cat">Cat</option>
                                <option value="Bird">Bird</option>
                                <option value="Other">Other</option>
                            </select>
                            <input
                                type="text" placeholder="Breed (e.g. Golden Retriever)" required
                                className="p-3 border border-gray-200 rounded-xl"
                                value={newPet.breed || ''}
                                onChange={e => setNewPet({ ...newPet, breed: e.target.value })}
                            />
                            <input
                                type="date" required
                                className="p-3 border border-gray-200 rounded-xl"
                                value={newPet.birthDate || ''}
                                onChange={e => setNewPet({ ...newPet, birthDate: e.target.value })}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowAddPet(false)} className="px-4 py-2 text-gray-500 font-medium">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-sm">Save Pet</button>
                        </div>
                    </form>
                )}

                {pets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-4">🐶</div>
                        <p className="font-medium text-gray-500">No pets added yet.</p>
                        <p className="text-sm text-gray-400">Add your first pet to get personalized store recommendations!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pets.map(pet => (
                            <div key={pet.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md transition group">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                    {pet.species === 'Dog' ? '🐕' : pet.species === 'Cat' ? '🐈' : '🐾'}
                                </div>
                                <div>
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
