import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || '');

const model: GenerativeModel = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
        responseMimeType: 'application/json',
    },
    systemInstruction: `
    You are an AI Medical Assistant for veterinary records.
    Extract the following information from the provided medical record (PDF/Image).
    
    SPECIAL INSTRUCTIONS FOR JOTFORM/DUMMY DATA:
    1. **Pet Name**: Look for the field labeled "Pet Name" (or similar). The value might be standard dummy text like "Integer ac leo" or similar Latin-looking text if it appears in that field.
    2. **Diagnosis/Summary**: Prioritize the "Medical History" table or section. Look for terms like "Hendrerit libero", "Purus bibendum", or specific medical conditions.
    3. **Medications**: Look for the "Immunization History" or "Medication" table. Extract vaccine names or medications listed there.
    4. **Dates**: 
       - "dateOfVisit": Look for the main date of the record.
       - "nextVaccinationDate": Look for "Next Schedule" or "Renews" dates in the "Immunization History" table.

    Return a JSON object with these exact keys:
    - petName (string or null)
    - dateOfVisit (string in ISO 8601 format YYYY-MM-DD, or null)
    - diagnosis (string or null - checks Medical History)
    - medications (array of strings, empty array if none - checks Immunization History)
    - nextVaccinationDate (string in ISO 8601 format YYYY-MM-DD, or null)
    - suggestedReminderDate (string in ISO 8601 format YYYY-MM-DD, calculated as 2 weeks before nextVaccinationDate, or null)
    
    If a field is not found, return null. Return STRICT JSON.
  `,
});

export async function POST(req: NextRequest) {
    if (!apiKey) {
        return NextResponse.json({ error: 'Gemini API Key missing' }, { status: 500 });
    }

    try {
        const { base64, mimeType } = await req.json();

        if (!base64) {
            return NextResponse.json({ error: 'No base64 data provided' }, { status: 400 });
        }

        // Prepare the part for Gemini (Base64 is passed directly)
        // The base64 string from client usually contains "data:application/pdf;base64," prefix.
        // Gemini needs just the data, but it handles the specific "inlineData" format.
        const base64Data = base64.split(',')[1] || base64; // Strip prefix if present

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType || 'application/pdf', // Use provided or default
                },
            },
            "Extract the medical data from this document.",
        ]);

        const response = await result.response;
        const text = response.text();
        const extractedData = JSON.parse(text);

        return NextResponse.json(extractedData);
    } catch (error: any) {
        console.error('Error processing with Gemini:', error);

        // Log detailed error info if available
        if (error.response) {
            console.error('Gemini API Response Error:', JSON.stringify(error.response, null, 2));
        }
        if (error.message) {
            console.error('Error Message:', error.message);
        }

        return NextResponse.json({
            error: 'Failed to process document with AI',
            details: error.message || 'Unknown error'
        }, { status: 500 });
    }
}
