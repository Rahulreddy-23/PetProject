import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { db } from '@/lib/firebase'; // Note: Client SDK might be limited if rules enforce auth
import { collection, addDoc } from 'firebase/firestore';

// Note: In a production app with strict rules, we should use firebase-admin here.
// For this MVP, we'll verify the API key and rely on the fact that we are saving "as AI"
// or we just return the text and let the Client save it (which ensures the User's auth is used).
// DECISION: Return the text to the client. The Client will save it to Firestore.
// This ensures the "AI Answer" is created by the authenticated user's session (or a special system user if we had one).
// But wait, we want the answer to look like it came from "AI Assistant".
// If the client saves it, the client has write permission.
// We will return the generated text. The client will call `addAnswer` with `isAiGenerated: true`.

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

const model: GenerativeModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
        responseMimeType: 'application/json',
    },
    systemInstruction: `
    You are an AI Veterinary Assistant named "Petora AI".
    Your goal is to provide helpful, safe, and context-aware advice for pet owners.
    
    CONTEXT:
    You will be provided with:
    1. Pet Details (Species, Breed, Age, Name)
    2. A Question from the owner.

    GUIDELINES:
    - tailored: Use the pet's name and specifics (e.g., "For a Golden Retriever like Buddy...")
    - safe: Always include a disclaimer if the issue sounds serious. detailed: Provide actionable advice.
    - tone: Empathetic, professional, and friendly.
    
    OUTPUT FORMAT:
    Return a JSON object with a single key: "answer" (string).
    The answer can contain markdown formatting.
    `,
});

export async function POST(req: NextRequest) {
    if (!apiKey) {
        return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 });
    }

    try {
        const { questionTitle, questionContent, petDetails, questionId } = await req.json();

        // Construct the prompt
        const prompt = `
        Pet Name: ${petDetails?.name || 'the pet'}
        Species: ${petDetails?.species || 'Unknown'}
        Breed: ${petDetails?.breed || 'Unknown'}
        Age/BirthDate: ${petDetails?.birthDate || 'Unknown'}
        
        Question Title: ${questionTitle}
        Question Content: ${questionContent}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let jsonResponse;
        try {
            jsonResponse = JSON.parse(text);
        } catch (e) {
            // Fallback if model returns raw text despite instructions
            jsonResponse = { answer: text };
        }

        return NextResponse.json(jsonResponse);

    } catch (error: any) {
        console.error('Error generating AI answer:', error);
        return NextResponse.json({
            error: 'Failed to generate answer',
            details: error.message
        }, { status: 500 });
    }
}
