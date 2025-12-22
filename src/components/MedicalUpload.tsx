'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Check, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { MedicalRecord, MedicalRecordType } from '@/types/schema';

// Health Timeline Component (Inline for now or extracted later)
const HealthTimeline = ({
    data,
    onSave,
    onEdit
}: {
    data: Partial<MedicalRecord>,
    onSave: () => void,
    onEdit: (field: string, value: any) => void
}) => {
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 max-w-2xl mx-auto mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-500" />
                New Record Summary
            </h3>

            <div className="space-y-4 relative pl-4 border-l-2 border-blue-100 ml-2">
                {/* Timeline Item: Date */}
                <div className="relative">
                    <div className="absolute -left-[21px] top-2 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white" />
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date of Visit</label>
                    <input
                        type="date"
                        value={data.date || ''}
                        onChange={(e) => onEdit('date', e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* Timeline Item: Type */}
                <div className="relative pt-4">
                    <div className="absolute -left-[21px] top-6 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white" />
                    <label className="block text-sm font-medium text-gray-500 mb-1">Record Type</label>
                    <select
                        value={data.type || 'Checkup'}
                        onChange={(e) => onEdit('type', e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="Vaccination">Vaccination</option>
                        <option value="Checkup">Checkup</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                {/* Timeline Item: Diagnosis */}
                <div className="relative pt-4">
                    <div className="absolute -left-[21px] top-6 w-3 h-3 rounded-full bg-purple-500 ring-4 ring-white" />
                    <label className="block text-sm font-medium text-gray-500 mb-1">Diagnosis / Summary</label>
                    <textarea
                        value={data.summary || ''}
                        onChange={(e) => onEdit('summary', e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]"
                        placeholder="Review diagnosis..."
                    />
                </div>

                {/* Timeline Item: Medications */}
                <div className="relative pt-4">
                    <div className="absolute -left-[21px] top-6 w-3 h-3 rounded-full bg-green-500 ring-4 ring-white" />
                    <label className="block text-sm font-medium text-gray-500 mb-1">Medications</label>
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-sm font-mono text-gray-700">
                        {/* Simple editable text for now for array */}
                        <input
                            type="text"
                            value={data.structuredData?.medications?.join(', ') || ''}
                            onChange={(e) => onEdit('medications', e.target.value.split(',').map(s => s.trim()))}
                            className="w-full bg-transparent outline-none"
                            placeholder="Medicine A, Medicine B"
                        />
                    </div>
                </div>

                {/* Timeline Item: Next Vax */}
                <div className="relative pt-4">
                    <div className="absolute -left-[21px] top-6 w-3 h-3 rounded-full bg-pink-500 ring-4 ring-white" />
                    <label className="block text-sm font-medium text-gray-500 mb-1">Next Vaccination (Reminder)</label>
                    <input
                        type="date"
                        value={data.extractedData?.nextVaccinationDate || ''}
                        onChange={(e) => onEdit('nextVaccinationDate', e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-pink-500 outline-none"
                    />
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={onSave}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md font-medium"
                >
                    <Save className="w-5 h-5" />
                    Save to Database
                </button>
            </div>
        </div>
    );
};

export default function MedicalUpload() {
    const { user } = useAuth();
    const [step, setStep] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState<Partial<MedicalRecord>>({});
    const [fileUrl, setFileUrl] = useState<string>('');
    const [pets, setPets] = useState<any[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<string>('');

    // Fetch pets on mount
    React.useEffect(() => {
        const fetchPets = async () => {
            if (!user) return;
            try {
                const petsCol = collection(db, 'users', user.uid, 'pets');
                const snapshot = await getDocs(petsCol);
                const petsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPets(petsData);
                if (petsData.length > 0) setSelectedPetId(petsData[0].id);
            } catch (e) {
                console.error("Error fetching pets", e);
            }
        };
        fetchPets();
    }, [user]);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setLoading(true);
        setStep(2); // Processing

        try {
            // 1. Convert to Base64 for API
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;

                // 2. Upload to Firebase Storage
                if (user) {
                    const storageRef = ref(storage, `medical_records/${user.uid}/${Date.now()}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    const url = await getDownloadURL(snapshot.ref);
                    setFileUrl(url);
                }

                // 3. Call AI API
                const response = await fetch('/api/scan-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        base64,
                        mimeType: file.type // Send actual mime type
                    }),
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.statusText}`);
                }

                const data = await response.json();

                // 4. Map API data to Form State
                setScanResult({
                    petId: 'temp-pet-id', // Needs actual Pet ID in real app
                    date: data.dateOfVisit || new Date().toISOString().split('T')[0],
                    type: 'Checkup', // Default, logic could infer
                    summary: data.diagnosis || 'Routine Checkup',
                    structuredData: {
                        medications: data.medications || [],
                        diagnosis: data.diagnosis,
                    },
                    extractedData: {
                        nextVaccinationDate: data.nextVaccinationDate,
                        suggestedReminderDate: data.suggestedReminderDate,
                        petName: data.petName,
                    },
                    isAiProcessed: true,
                });

                setStep(3); // Review
                setLoading(false);
            };
        } catch (error) {
            console.error("Scan failed", error);
            alert("Failed to scan document.");
            setStep(1);
            setLoading(false);
        }
    }, [user]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpeg', '.jpg'] },
        maxFiles: 1
    });

    const handleEdit = (field: string, value: any) => {
        setScanResult(prev => {
            if (field === 'medications') {
                return {
                    ...prev,
                    structuredData: { ...prev.structuredData, medications: value }
                };
            }
            if (field === 'nextVaccinationDate') {
                return {
                    ...prev,
                    extractedData: { ...prev.extractedData, nextVaccinationDate: value }
                }
            }
            return { ...prev, [field]: value };
        });
    };

    const handleSave = async () => {
        if (!user) {
            alert("You must be logged in to save records.");
            return;
        }
        try {
            // Sanitize scanResult to remove undefined values
            const cleanData = JSON.parse(JSON.stringify(scanResult));

            const recordsCol = collection(db, 'users', user.uid, 'medical_records');
            await addDoc(recordsCol, {
                ...cleanData,
                pdfUrl: fileUrl || null,
                userId: user.uid,
                createdAt: new Date().toISOString(),
            });
            alert("Record Saved!");
            setStep(1);
            setScanResult({});
            setFileUrl('');
        } catch (e: any) {
            console.error("Error saving record:", e);
            alert(`Error saving record: ${e.message}`);
        }
    };

    const handleManualEntry = () => {
        setScanResult({
            date: new Date().toISOString().split('T')[0],
            type: 'Checkup',
            summary: '',
            structuredData: { medications: [], diagnosis: '' },
            extractedData: { nextVaccinationDate: '', suggestedReminderDate: '', petName: '' },
            isAiProcessed: false
        });
        setFileUrl('');
        setStep(3); // Jump to editor
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            {step === 1 && (
                <div className="max-w-xl mx-auto space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-800">Medical Record Scanner</h2>
                        <p className="text-gray-500">Upload a record to extract insights using AI</p>
                    </div>

                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer relative overflow-hidden group
                            ${isDragActive ? 'border-[#A2D2FF] bg-blue-50 scale-[1.02]' : 'border-gray-200 hover:border-[#A2D2FF] hover:bg-gray-50'}`}
                    >
                        {/* Styled Dropdown - Floating top center or integrated */}
                        <div className="mb-8 relative z-20" onClick={(e) => e.stopPropagation()}>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Select Pet to Scan For</label>
                            <div className="relative inline-block w-full max-w-xs">
                                <select
                                    value={selectedPetId}
                                    onChange={(e) => setSelectedPetId(e.target.value)}
                                    className="w-full appearance-none px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A2D2FF] focus:border-[#A2D2FF] outline-none text-gray-700 font-medium cursor-pointer shadow-sm hover:border-gray-300 transition-colors"
                                >
                                    <option value="">-- Choose a Pet --</option>
                                    {pets.map(pet => (
                                        <option key={pet.id} value={pet.id}>{pet.name} ({pet.species})</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                </div>
                            </div>
                        </div>

                        <input {...getInputProps()} disabled={!selectedPetId} />

                        <div className={`flex flex-col items-center gap-4 transition-opacity duration-200 ${!selectedPetId ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                            <div className={`p-5 rounded-full transition-transform duration-500 ${isDragActive ? 'bg-blue-100 scale-110' : 'bg-blue-50'}`}>
                                <Upload className={`w-10 h-10 ${isDragActive ? 'text-blue-600' : 'text-[#A2D2FF]'}`} />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-700">Drop file here or click to browse</p>
                                <p className="text-sm text-gray-400 mt-2">Supports PDF, JPG, PNG</p>
                            </div>
                        </div>

                        {!selectedPetId && (
                            <div className="absolute inset-x-0 bottom-10 text-center pointer-events-none">
                                <span className="bg-red-50 text-red-500 px-4 py-1 rounded-full text-xs font-bold animate-pulse">
                                    Please select a pet first
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl">🐾</span>
                        </div>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-gray-800">Analyze Paws & Claws...</h3>
                    <p className="text-gray-500 mt-2">Our AI is reading the medical wizardry.</p>
                </div>
            )}

            {step === 3 && (
                <HealthTimeline
                    data={scanResult}
                    onSave={handleSave}
                    onEdit={handleEdit}
                />
            )}
        </div>
    );
}
