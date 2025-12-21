'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import MedicalUpload from '@/components/MedicalUpload';
import { db } from '@/lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { MedicalRecord, Pet } from '@/types/schema';
import { FileText, Calendar, Activity } from 'lucide-react';

export default function HealthPage() {
    const { user } = useAuth();
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Fetch Records from Subcollection
                const recordsCol = collection(db, 'users', user.uid, 'medical_records');
                const recordSnap = await getDocs(recordsCol);

                const userRecords = recordSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MedicalRecord));

                // Client side sort
                userRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setRecords(userRecords);

            } catch (error) {
                console.error("Error fetching health data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (!user) return <div className="p-10 text-center">Please log in to view health records.</div>;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-12">

            <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-800">Pet Health Center</h1>
                <p className="text-gray-500 mt-2">Manage your pet's medical records.</p>
            </div>

            {/* Scanner Section */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-1">
                <div className="bg-gradient-to-r from-blue-50 to-white p-6 rounded-t-3xl border-b border-gray-50 flex items-center gap-3">
                    <div className="p-2 bg-[#A2D2FF] bg-opacity-20 rounded-lg">
                        <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Medical Scanner</h2>
                </div>
                <div className="p-6">
                    <MedicalUpload />
                </div>
            </section>

            {/* Records Timeline */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-50 rounded-lg">
                        <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Medical Timeline</h2>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />)}
                    </div>
                ) : records.length === 0 ? (
                    <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">📂</div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">No records found</h3>
                        <p className="text-gray-500">Upload your pet's first document above to start the timeline!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {records.map((record) => (
                            <div key={record.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group">
                                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                                    {/* Icon & Title */}
                                    <div className="flex gap-4">
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${record.type === 'Vaccination' ? 'bg-green-50 text-green-600' :
                                            record.type === 'Surgery' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            <Activity className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-gray-800 text-lg">{record.summary}</h3>
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${record.type === 'Vaccination' ? 'bg-green-100 text-green-700' :
                                                    record.type === 'Surgery' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {record.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-sm text-[#FF9F1C] font-semibold gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {record.date}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    {record.pdfUrl && (
                                        <a
                                            href={record.pdfUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-4 py-2 bg-gray-50 text-gray-600 text-sm font-bold rounded-xl hover:bg-blue-50 hover:text-blue-600 transition whitespace-nowrap"
                                        >
                                            View PDF
                                        </a>
                                    )}
                                </div>

                                {/* Details */}
                                {record.structuredData?.medications && record.structuredData.medications.length > 0 && (
                                    <div className="mt-4 ml-16 p-4 bg-gray-50 rounded-xl">
                                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Medications & Details</p>
                                        <div className="flex flex-wrap gap-2">
                                            {record.structuredData.medications.map((med, idx) => (
                                                <span key={idx} className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">
                                                    {med}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
