'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Check, Loader2, Save, Shield, Syringe, Calendar, Pill, AlertCircle, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { MedicalRecord, MedicalRecordType } from '@/types/schema';

export default function MedicalUpload() {
    const { user } = useAuth();
    const [step, setStep] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [scanResult, setScanResult] = useState<Partial<MedicalRecord>>({});
    const [fileUrl, setFileUrl] = useState<string>('');
    const [pets, setPets] = useState<any[]>([]);
    const [selectedPetId, setSelectedPetId] = useState<string>('');
    const [saving, setSaving] = useState(false);

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
        if (!file || !selectedPetId) return;

        setLoading(true);
        setStep(2);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64 = reader.result as string;

                if (user) {
                    const storageRef = ref(storage, `medical_records/${user.uid}/${Date.now()}_${file.name}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    const url = await getDownloadURL(snapshot.ref);
                    setFileUrl(url);
                }

                const response = await fetch('/api/scan-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ base64, mimeType: file.type }),
                });

                if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

                const data = await response.json();

                setScanResult({
                    petId: selectedPetId,
                    date: data.dateOfVisit || new Date().toISOString().split('T')[0],
                    type: 'Checkup',
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

                setStep(3);
                setLoading(false);
            };
        } catch (error) {
            console.error("Scan failed", error);
            alert("Failed to scan document.");
            setStep(1);
            setLoading(false);
        }
    }, [user, selectedPetId]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpeg', '.jpg'] },
        maxFiles: 1
    });

    const handleEdit = (field: string, value: any) => {
        setScanResult(prev => {
            if (field === 'medications') {
                return { ...prev, structuredData: { ...prev.structuredData, medications: value } };
            }
            if (field === 'nextVaccinationDate') {
                return { ...prev, extractedData: { ...prev.extractedData, nextVaccinationDate: value } };
            }
            return { ...prev, [field]: value };
        });
    };

    const handleSave = async () => {
        if (!user) return alert("You must be logged in to save records.");

        setSaving(true);
        try {
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
        } finally {
            setSaving(false);
        }
    };

    const handleManualEntry = () => {
        setScanResult({
            petId: selectedPetId,
            date: new Date().toISOString().split('T')[0],
            type: 'Checkup',
            summary: '',
            structuredData: { medications: [], diagnosis: '' },
            extractedData: { nextVaccinationDate: '', suggestedReminderDate: '', petName: '' },
            isAiProcessed: false
        });
        setFileUrl('');
        setStep(3);
    };

    const selectedPet = pets.find(p => p.id === selectedPetId);

    return (
        <div className="w-full max-w-3xl mx-auto p-4">
            {step === 1 && (
                <div className="space-y-6">
                    {/* Passport Header */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
                        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-8 -translate-x-8" />

                        <div className="relative">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                                <Shield className="w-5 h-5" />
                                <span className="font-bold text-sm">Pet Health Passport</span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold mb-2">Medical Records Scanner</h1>
                            <p className="text-blue-100">Upload documents to extract health insights using AI</p>
                        </div>
                    </div>

                    {/* Pet Selector */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <label className="block text-sm font-bold text-gray-700 mb-3">Select Pet</label>
                        {pets.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                <p>No pets added yet. Add a pet in your profile first.</p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3">
                                {pets.map(pet => (
                                    <button
                                        key={pet.id}
                                        type="button"
                                        onClick={() => setSelectedPetId(pet.id)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all
                                            ${selectedPetId === pet.id
                                                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                                                : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                                    >
                                        <span className="text-2xl">{pet.species === 'Dog' ? '🐕' : pet.species === 'Cat' ? '🐈' : '🐾'}</span>
                                        <div className="text-left">
                                            <p className="font-bold">{pet.name}</p>
                                            <p className="text-xs opacity-70">{pet.breed}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upload Area */}
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer relative overflow-hidden
                            ${!selectedPetId ? 'opacity-50 cursor-not-allowed' : ''}
                            ${isDragActive ? 'border-blue-400 bg-blue-50 scale-[1.01]' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                    >
                        <input {...getInputProps()} disabled={!selectedPetId} />

                        <div className="flex flex-col items-center gap-4">
                            <div className={`p-6 rounded-full transition-all ${isDragActive ? 'bg-blue-100 scale-110' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
                                <Upload className={`w-10 h-10 ${isDragActive ? 'text-blue-600' : 'text-blue-400'}`} />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-gray-700">Drop your medical document here</p>
                                <p className="text-sm text-gray-400 mt-2">PDF, JPG, or PNG up to 10MB</p>
                            </div>
                        </div>

                        {!selectedPetId && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                                <span className="bg-red-50 text-red-500 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Please select a pet first
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Manual Entry */}
                    <div className="text-center">
                        <button
                            onClick={handleManualEntry}
                            disabled={!selectedPetId}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-2 mx-auto transition disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4" />
                            Create a record manually
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-2xl animate-bounce">
                            🐾
                        </div>
                    </div>
                    <h3 className="mt-8 text-2xl font-bold text-gray-800">Analyzing Document...</h3>
                    <p className="text-gray-500 mt-2">Our AI is extracting health information</p>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6">
                    {/* Passport Card Header */}
                    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl">
                                {selectedPet?.species === 'Dog' ? '🐕' : selectedPet?.species === 'Cat' ? '🐈' : '🐾'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{selectedPet?.name || 'Your Pet'}</h2>
                                <p className="text-emerald-100">{selectedPet?.breed || 'Pet'} • Health Record</p>
                            </div>
                            {scanResult.isAiProcessed && (
                                <div className="ml-auto bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> AI Verified
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Record Form */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-5">
                        {/* Date & Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 text-blue-500" /> Date of Visit
                                </label>
                                <input
                                    type="date"
                                    value={scanResult.date || ''}
                                    onChange={(e) => handleEdit('date', e.target.value)}
                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                    <FileText className="w-4 h-4 text-purple-500" /> Record Type
                                </label>
                                <select
                                    value={scanResult.type || 'Checkup'}
                                    onChange={(e) => handleEdit('type', e.target.value)}
                                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none"
                                >
                                    <option value="Vaccination">💉 Vaccination</option>
                                    <option value="Checkup">🩺 Checkup</option>
                                    <option value="Surgery">⚕️ Surgery</option>
                                    <option value="Other">📋 Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Diagnosis */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                <Shield className="w-4 h-4 text-emerald-500" /> Diagnosis / Summary
                            </label>
                            <textarea
                                value={scanResult.summary || ''}
                                onChange={(e) => handleEdit('summary', e.target.value)}
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
                                rows={3}
                                placeholder="Describe the diagnosis or visit summary..."
                            />
                        </div>

                        {/* Medications */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                <Pill className="w-4 h-4 text-pink-500" /> Medications
                            </label>
                            <input
                                type="text"
                                value={scanResult.structuredData?.medications?.join(', ') || ''}
                                onChange={(e) => handleEdit('medications', e.target.value.split(',').map(s => s.trim()))}
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-200 outline-none"
                                placeholder="Medicine A, Medicine B, ..."
                            />
                        </div>

                        {/* Next Vaccination */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                <Syringe className="w-4 h-4 text-orange-500" /> Next Vaccination Due
                            </label>
                            <input
                                type="date"
                                value={scanResult.extractedData?.nextVaccinationDate || ''}
                                onChange={(e) => handleEdit('nextVaccinationDate', e.target.value)}
                                className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none"
                            />
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-4 border border-gray-200 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-bold hover:opacity-90 transition shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            Save to Health Passport
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
