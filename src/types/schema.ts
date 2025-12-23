export type UserRole = 'customer' | 'admin';

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: UserRole;
    createdAt?: string; // ISO date string
    // Social Fields (NEW)
    username?: string;         // Unique @username (lowercase, permanent)
    bio?: string;              // User bio
    followingCount: number;    // Denormalized
    followersCount: number;    // Denormalized
    // Profile Fields
    fullName?: string;
    address?: string;
    phoneNumber?: string;
}

export interface WeightEntry {
    date: string; // ISO date string
    weight: number; // in kg or lbs
}

export interface Pet {
    id: string;
    ownerId: string;
    name: string;
    species: string; // e.g., 'Dog', 'Cat'
    breed: string;
    birthDate: string; // ISO date string
    weightTracker: WeightEntry[];
    upcomingReminders: string[]; // List of reminder IDs or descriptions
    photoUrl?: string;
}

export type MedicalRecordType = 'Vaccination' | 'Checkup' | 'Surgery' | 'Other';

export interface MedicalRecord {
    id: string;
    petId: string;
    date: string; // ISO date string
    type: MedicalRecordType;
    pdfUrl?: string;
    summary: string;
    isAiProcessed: boolean;
    structuredData?: {
        diagnosis?: string;
        medications?: string[];
    };
    extractedData?: Record<string, any>; // Flexible JSON for AI extraction
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl: string;
    stock: number;
    tags: string[]; // e.g., "senior-dog", "allergy-friendly"
    rating: number; // 0-5
}

export type PostVisibility = 'public' | 'friends' | 'private';

export interface Post {
    id: string;
    userId: string;
    authorName: string; // Denormalized
    authorPhoto: string | null; // Denormalized
    authorUsername: string; // Denormalized (NEW)
    petId?: string; // Optional linkage to a specific pet
    // Multi-image support (NEW)
    mediaUrls: string[];       // Array of media URLs
    mediaType: 'image' | 'video' | 'carousel'; // Added carousel type
    mediaWidth?: number; // For avoiding layout shifts (first image)
    mediaHeight?: number;
    caption: string;
    likes: string[]; // Array of User IDs
    visibility: PostVisibility; // NEW
    tags?: string[]; // Category tags (NEW)
    createdAt: string; // ISO date string
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    userName: string; // Denormalized for display
    userPhoto: string | null; // Denormalized
    text: string;
    createdAt: string; // ISO date string
}

export interface Question {
    id: string;
    userId: string;
    authorName: string; // Denormalized
    authorPhoto: string | null;
    petId: string; // Required for context
    title: string;
    content: string;
    imageUrl?: string; // Optional image attachment
    tags: string[];
    upvotes: string[]; // Array of User IDs
    createdAt: string; // ISO date string
    answerCount: number; // Optimization for listing
}

export interface Answer {
    id: string;
    questionId: string;
    userId: string; // 'AI' for AI assistant
    authorName: string;
    authorPhoto: string | null;
    content: string;
    isAiGenerated: boolean;
    upvotes: string[]; // Array of User IDs
    createdAt: string; // ISO date string
}
