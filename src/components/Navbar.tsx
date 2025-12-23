'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Activity, User, Camera, MessageSquare } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
    const pathname = usePathname();
    const { cart, setOpenCart } = useCart();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">

                    {/* Brand */}
                    <Link href="/store" className="flex items-center gap-2 group">
                        <div className="relative h-8 w-auto aspect-square">
                            <img src="/logo.png" alt="PetProject Logo" className="h-full w-auto object-contain" />
                        </div>
                        <span className="text-xl font-bold text-gray-800 tracking-tight">
                            PetProject
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-8">
                        <Link
                            href="/store"
                            className={`flex items-center gap-2 font-medium transition-colors h-full px-2 ${isActive('/store') ? 'text-[#FF9F1C] border-b-2 border-[#A2D2FF]' : 'text-gray-500 hover:text-[#A2D2FF]'
                                }`}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            <span className="hidden sm:inline">Store</span>
                        </Link>

                        <Link
                            href="/petora"
                            className={`flex items-center gap-2 font-medium transition-colors h-full px-2 ${isActive('/petora') ? 'text-[#FF9F1C] border-b-2 border-[#A2D2FF]' : 'text-gray-500 hover:text-[#A2D2FF]'
                                }`}
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span className="hidden sm:inline">Petora</span>
                        </Link>

                        <Link
                            href="/petbook"
                            className={`flex items-center gap-2 font-medium transition-colors h-full px-2 ${isActive('/petbook') ? 'text-[#FF9F1C] border-b-2 border-[#A2D2FF]' : 'text-gray-500 hover:text-[#A2D2FF]'
                                }`}
                        >
                            <Camera className="w-5 h-5" />
                            <span className="hidden sm:inline">Petbook</span>
                        </Link>

                        <Link
                            href="/health"
                            className={`flex items-center gap-2 font-medium transition-colors h-full px-2 ${isActive('/health') ? 'text-[#FF9F1C] border-b-2 border-[#A2D2FF]' : 'text-gray-500 hover:text-[#A2D2FF]'
                                }`}
                        >
                            <Activity className="w-5 h-5" />
                            <span className="hidden sm:inline">Health</span>
                        </Link>

                        <Link
                            href="/profile"
                            className={`flex items-center gap-2 font-medium transition-colors h-full px-2 ${isActive('/profile') ? 'text-[#FF9F1C] border-b-2 border-[#A2D2FF]' : 'text-gray-500 hover:text-[#A2D2FF]'
                                }`}
                        >
                            <User className="w-5 h-5" />
                            <span className="hidden sm:inline">Profile</span>
                        </Link>

                        {/* Cart Trigger */}
                        <button
                            onClick={() => setOpenCart(true)}
                            className="relative p-2 bg-gray-50 rounded-full hover:bg-[#A2D2FF] hover:bg-opacity-20 transition-colors group"
                        >
                            <ShoppingBag className="w-5 h-5 text-gray-700 group-hover:text-blue-600" />
                            {cart.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#FF9F1C] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                                    {cart.reduce((a, b) => a + b.quantity, 0)}
                                </span>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </nav>
    );
}
