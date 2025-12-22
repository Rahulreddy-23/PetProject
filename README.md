# PetProject

PetProject is an AI-powered pet health companion application designed to help pet owners manage their pets' health records, store profiles, and receive product recommendations.

## Tech Stack
- **Framework**: Next.js 16 (Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Pure White / Soft Blue / Warm Orange theme)
- **Backend/DB**: Firebase (Auth, Firestore, Storage)
- **AI**: Google Gemini 1.5 Flash (for Medical PDF Scanning)

## Key Features

### 1. Store
- Smart product recommendations based on your pet's breed.
- Shopping list functionality (Cart).

### 2. Health Center
- **Medical PDF Scanner**: Upload veterinary records (PDF/Images).
- **Gemini AI Integration**: Automatically extracts Pet Name, Diagnosis, Medications, and Vaccinations.
- **Timeline**: Visual history of your pet's medical events.
- **Privacy**: All data is securely stored in user-specific subcollections.

### 3. Profile
- **Pet Management**: Add and manage multiple pets.
- **Onboarding Guard**: Ensures user profile completeness (Name, Address, Phone).
- **Security**: Strict authentication and data isolation.

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Rahulreddy-23/PetProject.git
    cd PetProject
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create `.env.local` and add your keys:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    GEMINI_API_KEY=...
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```

5.  **Build for Production**:
    ```bash
    npm run build
    npm start
    ```

## Architecture
- **Firestore**: Data is nested under `users/{uid}/pets` and `users/{uid}/medical_records` to ensure security rules compliance.
- **Storage**: Medical records are stored in `medical_records/{uid}/`.

## Branding
- **Theme**: Pure White (#FFFFFF) with Soft Blue (#A2D2FF) and Warm Orange (#FF9F1C) accents.
- **Logo**: Custom "PetProject" branding throughout.
