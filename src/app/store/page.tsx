'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Product, Pet } from '@/types/schema';
import { ShoppingCart, X, Plus, Trash2, CheckCircle, Smartphone } from 'lucide-react';

const MOCK_PRODUCTS: Product[] = [
    { id: '1', name: 'Premium Dog Food', description: 'High protein for active dogs.', price: 500, category: 'Food', imageUrl: 'https://placehold.co/400x400/png?text=Dog+Food', stock: 10, rating: 4.8, tags: ['food', 'dog'] },
    { id: '2', name: 'Catnip Toy', description: 'Organic catnip.', price: 150, category: 'Toys', imageUrl: 'https://placehold.co/400x400/png?text=Cat+Toy', stock: 50, rating: 4.5, tags: ['toy', 'cat'] },
    { id: '3', name: 'Large Breed Kibble', description: 'Specific for Golden Retrievers and Labs.', price: 1200, category: 'Food', imageUrl: 'https://placehold.co/400x400/png?text=Large+Kibble', stock: 20, rating: 4.9, tags: ['food', 'dog', 'large-breed', 'golden-retriever'] },
    { id: '4', name: 'Vaccine Passport Holder', description: 'Keep records safe.', price: 200, category: 'Accessories', imageUrl: 'https://placehold.co/400x400/png?text=Passport', stock: 100, rating: 4.2, tags: ['accessory'] },
];

export default function StorePage() {
    const { user } = useAuth();
    const { addToCart, cart, removeFromCart, totalAmount, openCart, setOpenCart } = useCart();
    const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<Product[]>([]);

    // Fetch Pets for Smart Recommendations
    useEffect(() => {
        const fetchPets = async () => {
            if (!user) return;
            try {
                const petsCol = collection(db, 'users', user.uid, 'pets');
                const snapshot = await getDocs(petsCol);
                const userPets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pet));

                // Smart Logic
                const breeds = userPets.map(p => p.breed.toLowerCase());
                const recs = MOCK_PRODUCTS.filter(p =>
                    p.tags.some(tag => breeds.some(b => b.includes(tag) || tag.includes(b)))
                );
                setRecommendations(recs);
            } catch (e) {
                console.error("Error fetching pets", e);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchPets();
        } else {
            setLoading(false);
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-white relative">
            <div className="p-6 max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800">Pet Store</h1>
                </header>

                {/* Smart Recommendations */}
                {recommendations.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <span className="text-2xl">✨</span>
                            For your pets
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {recommendations.map(product => (
                                <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} />
                            ))}
                        </div>
                    </div>
                )}

                {/* All Products */}
                <h2 className="text-xl font-bold text-gray-800 mb-6">All Products</h2>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-gray-50 rounded-2xl h-80 animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} />
                        ))}
                    </div>
                )}
            </div>

            {/* Cart Sidebar */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 ${openCart ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" /> Shopping List
                        </h2>
                        <button onClick={() => setOpenCart(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                                <p>Your list is empty.</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex gap-4 border-b border-gray-50 pb-4">
                                    <div className="relative w-20 h-20 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden">
                                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-800">{item.name}</h3>
                                        <p className="text-sm text-gray-500 font-medium">₹{item.price} x {item.quantity}</p>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-300 hover:text-red-500 transition">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-8 border-t border-gray-100 bg-gray-50">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-gray-500 font-medium">Total Estimate</span>
                            <span className="text-3xl font-bold text-[#FF9F1C]">₹{totalAmount}</span>
                        </div>
                        <button
                            disabled
                            className="w-full py-4 bg-gray-200 text-gray-400 rounded-2xl font-bold cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Smartphone className="w-5 h-5" /> Checkout Disabled
                        </button>
                    </div>
                </div>
            </div>

            {/* Overlay */}
            {openCart && (
                <div onClick={() => setOpenCart(false)} className="fixed inset-0 bg-black bg-opacity-10 z-40 backdrop-blur-sm" />
            )}
        </div>
    );
}

function ProductCard({ product, onAdd }: { product: Product, onAdd: () => void }) {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition group">
            <div className="relative h-56 w-full bg-gray-50 rounded-xl mb-4 overflow-hidden">
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-contain p-6 group-hover:scale-105 transition-transform"
                    loading="lazy"
                />
            </div>
            <div>
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 line-clamp-1 text-lg" title={product.name}>{product.name}</h3>
                    <span className="flex items-center text-xs font-bold bg-yellow-400/20 text-yellow-700 px-2 py-1 rounded-full">
                        ★ {product.rating}
                    </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">{product.description}</p>
                <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
                    <button
                        onClick={onAdd}
                        className="p-3 bg-[#FF9F1C] text-white rounded-xl hover:bg-orange-500 transition-colors shadow-sm active:scale-95 transform"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
