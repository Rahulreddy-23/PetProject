export type UserRole = 'customer' | 'admin';

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: UserRole;
    createdAt?: string; // ISO date string
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
