'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Pet } from '@/types/schema';
import { ExternalLink, ShoppingBag, Sparkles, Star } from 'lucide-react';

interface AffiliateProduct {
    id: string;
    name: string;
    description: string;
    price: string;
    imageUrl: string;
    affiliateUrl: string;
    rating: number;
    tags: string[];
}

const AFFILIATE_PRODUCTS: AffiliateProduct[] = [
    {
        id: '1',
        name: 'Premium Grain-Free Dog Food',
        description: 'High protein, grain-free nutrition for active dogs. Made with real chicken.',
        price: '₹2,499',
        imageUrl: 'https://placehold.co/400x400/f8fafc/64748b?text=🐕+Food',
        affiliateUrl: 'https://amazon.in/?tag=YOUR_TAG',
        rating: 4.8,
        tags: ['food', 'dog']
    },
    {
        id: '2',
        name: 'Interactive Cat Toy Bundle',
        description: 'Keep your feline entertained for hours with this 5-piece toy set.',
        price: '₹899',
        imageUrl: 'https://placehold.co/400x400/fef3c7/92400e?text=🐈+Toys',
        affiliateUrl: 'https://amazon.in/?tag=YOUR_TAG',
        rating: 4.6,
        tags: ['toy', 'cat']
    },
    {
        id: '3',
        name: 'Orthopedic Pet Bed - Large',
        description: 'Memory foam bed for senior dogs. Joint support & easy to clean cover.',
        price: '₹3,999',
        imageUrl: 'https://placehold.co/400x400/e0e7ff/3730a3?text=🛏️+Bed',
        affiliateUrl: 'https://amazon.in/?tag=YOUR_TAG',
        rating: 4.9,
        tags: ['bed', 'dog', 'large-breed']
    },
    {
        id: '4',
        name: 'Automatic Water Fountain',
        description: 'Fresh, filtered water 24/7. 2L capacity, ultra-quiet pump.',
        price: '₹1,299',
        imageUrl: 'https://placehold.co/400x400/dcfce7/166534?text=💧+Fountain',
        affiliateUrl: 'https://amazon.in/?tag=YOUR_TAG',
        rating: 4.5,
        tags: ['accessory', 'cat', 'dog']
    },
    {
        id: '5',
        name: 'Grooming Kit - 6 Piece',
        description: 'Professional grade brushes, nail clippers, and deshedding tools.',
        price: '₹1,599',
        imageUrl: 'https://placehold.co/400x400/fce7f3/9d174d?text=✂️+Grooming',
        affiliateUrl: 'https://amazon.in/?tag=YOUR_TAG',
        rating: 4.7,
        tags: ['grooming', 'dog', 'cat']
    },
    {
        id: '6',
        name: 'Reflective Dog Harness',
        description: 'No-pull design with reflective strips for safe night walks.',
        price: '₹799',
        imageUrl: 'https://placehold.co/400x400/fed7aa/c2410c?text=🦺+Harness',
        affiliateUrl: 'https://amazon.in/?tag=YOUR_TAG',
        rating: 4.4,
        tags: ['accessory', 'dog']
    },
];

export default function StorePage() {
    const { user } = useAuth();
    const [recommendations, setRecommendations] = useState<AffiliateProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPets = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const petsCol = collection(db, 'users', user.uid, 'pets');
                const snapshot = await getDocs(petsCol);
                const userPets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Pet));

                const species = userPets.map(p => p.species.toLowerCase());
                const recs = AFFILIATE_PRODUCTS.filter(p =>
                    p.tags.some(tag => species.includes(tag))
                );
                setRecommendations(recs.length > 0 ? recs : AFFILIATE_PRODUCTS.slice(0, 3));
            } catch (e) {
                console.error("Error fetching pets", e);
            } finally {
                setLoading(false);
            }
        };

        fetchPets();
    }, [user]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-white">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#FF9F1C] to-[#FFBF69] text-white">
                <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <ShoppingBag className="w-8 h-8" />
                        <h1 className="text-4xl md:text-5xl font-bold">Pet Store</h1>
                    </div>
                    <p className="text-xl md:text-2xl font-medium opacity-90">
                        Buy your pet something cute. 🐾
                    </p>
                    <p className="text-sm opacity-75 mt-2">
                        We may earn a commission on purchases made through these links.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-10">
                {/* Personalized Recommendations */}
                {recommendations.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-[#FF9F1C]" />
                            <h2 className="text-xl font-bold text-gray-800">Recommended for your pets</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recommendations.map(product => (
                                <ProductCard key={product.id} product={product} featured />
                            ))}
                        </div>
                    </div>
                )}

                {/* All Products */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-6">All Products</h2>
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white rounded-3xl h-80 animate-pulse shadow-sm" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {AFFILIATE_PRODUCTS.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ProductCard({ product, featured = false }: { product: AffiliateProduct, featured?: boolean }) {
    return (
        <div className={`bg-white rounded-3xl overflow-hidden shadow-sm border transition-all hover:shadow-lg hover:-translate-y-1 group
            ${featured ? 'border-[#FF9F1C]/30 ring-1 ring-[#FF9F1C]/20' : 'border-gray-100'}`}>
            {/* Image */}
            <div className="relative h-48 bg-gray-50 overflow-hidden">
                <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                />
                {featured && (
                    <div className="absolute top-3 left-3 bg-[#FF9F1C] text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> For You
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{product.name}</h3>
                    <span className="flex items-center gap-1 text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex-shrink-0">
                        <Star className="w-3 h-3 fill-current" /> {product.rating}
                    </span>
                </div>

                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">{product.description}</p>

                <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{product.price}</span>
                    <a
                        href={product.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#FF9900] text-white rounded-xl font-bold hover:bg-[#e68a00] transition shadow-sm"
                    >
                        Buy on Amazon
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </div>
        </div>
    );
}
