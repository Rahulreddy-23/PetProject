'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Activity, User, Camera, MessageSquare, Search, Home, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useState } from 'react';

export default function Navbar() {
    const pathname = usePathname();
    const { cart, setOpenCart } = useCart();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path: string) => pathname === path;

    // Desktop nav items
    const navItems = [
        { href: '/petbook', icon: Camera, label: 'Petbook' },
        { href: '/petora', icon: MessageSquare, label: 'Petora' },
        { href: '/store', icon: ShoppingBag, label: 'Store' },
        { href: '/health', icon: Activity, label: 'Health' },
        { href: '/profile', icon: User, label: 'Profile' },
    ];

    // Mobile bottom nav items (subset)
    const mobileNavItems = [
        { href: '/petbook', icon: Home, label: 'Feed' },
        { href: '/search', icon: Search, label: 'Search' },
        { href: '/store', icon: ShoppingBag, label: 'Store' },
        { href: '/health', icon: Activity, label: 'Health' },
        { href: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <>
            {/* Desktop Top Navbar */}
            <nav className="hidden md:block bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">

                        {/* Brand */}
                        <Link href="/petbook" className="flex items-center gap-2 group">
                            <div className="relative h-8 w-auto aspect-square">
                                <img src="/logo.png" alt="PetProject Logo" className="h-full w-auto object-contain" />
                            </div>
                            <span className="text-xl font-bold text-gray-800 tracking-tight">
                                PetProject
                            </span>
                        </Link>

                        {/* Navigation Links */}
                        <div className="flex items-center gap-2">
                            {/* Search */}
                            <Link
                                href="/search"
                                className={`p-2.5 rounded-xl transition-all ${isActive('/search') ? 'bg-[#A2D2FF]/30 text-[#FF9F1C]' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                <Search className="w-5 h-5" />
                            </Link>

                            {navItems.map(item => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
                                        ${isActive(item.href)
                                            ? 'bg-[#FF9F1C]/10 text-[#FF9F1C]'
                                            : 'text-gray-500 hover:bg-gray-100'}`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </Link>
                            ))}


                        </div>

                    </div>
                </div>
            </nav>

            {/* Mobile Top Header (Simplified) */}
            <nav className="md:hidden bg-white/90 backdrop-blur-lg border-b border-gray-100 sticky top-0 z-50">
                <div className="flex justify-between items-center h-14 px-4">
                    <Link href="/petbook" className="flex items-center gap-2">
                        <img src="/logo.png" alt="Logo" className="h-7 w-auto" />
                        <span className="font-bold text-gray-800">PetProject</span>
                    </Link>

                    <div className="flex items-center gap-2">

                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 z-50 safe-area-bottom">
                <div className="flex justify-around items-center h-16 px-2">
                    {mobileNavItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px]
                                ${isActive(item.href)
                                    ? 'text-[#FF9F1C]'
                                    : 'text-gray-400'}`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'scale-110' : ''} transition-transform`} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Spacer for mobile bottom nav */}
            <div className="md:hidden h-16" />
        </>
    );
}
