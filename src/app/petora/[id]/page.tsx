'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getQuestion, getAnswers, addAnswer, toggleQuestionUpvote, toggleAnswerUpvote } from '@/lib/petora';
import { Question, Answer } from '@/types/schema';
import { MessageSquare, ThumbsUp, ArrowLeft, Send, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PetoraDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useAuth();

    const [question, setQuestion] = useState<Question | null>(null);
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [loading, setLoading] = useState(true);
    const [newAnswer, setNewAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Data
    const fetchData = async () => {
        if (!id) return;
        try {
            const q = await getQuestion(id as string);
            setQuestion(q);
            if (q) {
                const a = await getAnswers(q.id);
                setAnswers(a);
            }
        } catch (error) {
            console.error("Error fetching detail:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Poll for AI answer if it's missing (simple polling for demo)
        const interval = setInterval(() => {
            if (id) {
                // Background refresh only for answers
                getAnswers(id as string).then(setAnswers).catch(() => { });
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [id]);

    const handleUpvoteQuestion = async () => {
        if (!user || !question) return;
        // Optimistic UI update
        const isUpvoted = question.upvotes?.includes(user.uid);
        const newUpvotes = isUpvoted
            ? question.upvotes.filter(uid => uid !== user.uid)
            : [...(question.upvotes || []), user.uid];

        setQuestion({ ...question, upvotes: newUpvotes });

        try {
            await toggleQuestionUpvote(question.id, user.uid);
        } catch (e) {
            console.error("Vote failed", e);
            fetchData(); // Revert
        }
    };

    const handleUpvoteAnswer = async (answerId: string) => {
        if (!user) return;
        const answerIndex = answers.findIndex(a => a.id === answerId);
        if (answerIndex === -1) return;

        const answer = answers[answerIndex];
        const isUpvoted = answer.upvotes?.includes(user.uid);
        const newUpvotes = isUpvoted
            ? answer.upvotes.filter(uid => uid !== user.uid)
            : [...(answer.upvotes || []), user.uid];

        const updatedAnswers = [...answers];
        updatedAnswers[answerIndex] = { ...answer, upvotes: newUpvotes };
        setAnswers(updatedAnswers);

        try {
            await toggleAnswerUpvote(answerId, user.uid);
        } catch (e) {
            console.error("Vote failed", e);
            fetchData();
        }
    };

    const handlePostAnswer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !question || !newAnswer.trim()) return;

        setIsSubmitting(true);
        try {
            await addAnswer({
                questionId: question.id,
                userId: user.uid,
                authorName: user.displayName || 'Anonymous',
                authorPhoto: user.photoURL || null,
                content: newAnswer,
                isAiGenerated: false
            });
            setNewAnswer('');
            fetchData();
        } catch (e) {
            console.error("Failed to post answer", e);
            alert("Failed to post answer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="text-center py-20 bg-gray-50 min-h-screen">Loading...</div>;
    if (!question) return <div className="text-center py-20 bg-gray-50 min-h-screen">Question not found.</div>;

    const aiAnswer = answers.find(a => a.isAiGenerated);
    const userAnswers = answers.filter(a => !a.isAiGenerated);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Nav */}
            <div className="bg-white border-b border-gray-200 py-4 px-4 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="font-bold text-gray-800">Discussion</span>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
                {/* Question Card */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">
                            {question.authorName[0]}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">{question.authorName}</h3>
                            <span className="text-xs text-gray-500">{new Date(question.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{question.title}</h1>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">{question.content}</p>

                    {question.imageUrl && (
                        <div className="mb-6 rounded-xl overflow-hidden border border-gray-100 max-w-lg">
                            <img src={question.imageUrl} alt="Pet Condition" className="w-full h-auto" />
                        </div>
                    )}

                    <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={handleUpvoteQuestion}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition font-medium
                                ${question.upvotes?.includes(user?.uid || '')
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'hover:bg-gray-50 text-gray-600'}`}
                        >
                            <ThumbsUp className="w-5 h-5" fill={question.upvotes?.includes(user?.uid || '') ? "currentColor" : "none"} />
                            <span>{question.upvotes?.length || 0} Upvotes</span>
                        </button>
                        <div className="flex items-center gap-2 text-gray-500 px-4">
                            <MessageSquare className="w-5 h-5" />
                            <span>{answers.length} Responses</span>
                        </div>
                    </div>
                </div>

                {/* AI Answer Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        <h2 className="text-lg font-bold text-gray-800">AI Assistant</h2>
                    </div>

                    {aiAnswer ? (
                        <div className="bg-gradient-to-br from-purple-50 to-white p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <Sparkles className="w-32 h-32" />
                            </div>

                            <div className="prose prose-purple max-w-none mb-6 text-gray-800">
                                {/* Simple markdown rendering or just text */}
                                <div dangerouslySetInnerHTML={{ __html: aiAnswer.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-purple-100">
                                <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                                    AI Generated
                                </span>
                                <button
                                    onClick={() => handleUpvoteAnswer(aiAnswer.id)}
                                    className={`flex items-center gap-2 text-sm font-medium transition
                                        ${aiAnswer.upvotes?.includes(user?.uid || '') ? 'text-purple-700' : 'text-gray-500 hover:text-purple-600'}`}
                                >
                                    <ThumbsUp className="w-4 h-4" />
                                    Helpful ({aiAnswer.upvotes?.length || 0})
                                </button>
                            </div>

                            <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 bg-white/50 p-3 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                                <p>This response is generated by AI based on the details you provided. It is not a substitute for professional veterinary advice. Please consult a vet for serious concerns.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 text-center animate-pulse">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Sparkles className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-gray-800 font-medium">Analyzing Pet Profile...</h3>
                            <p className="text-sm text-gray-500 mt-1">Petora AI is writing a personalized response.</p>
                        </div>
                    )}
                </div>

                {/* Community Answers */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 px-2">Community Responses</h2>

                    {userAnswers.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 border-dashed">
                            <p className="text-gray-500">No community answers yet. Be the first!</p>
                        </div>
                    ) : (
                        userAnswers.map(answer => (
                            <div key={answer.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                        {answer.authorName[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">{answer.authorName}</h4>
                                        <span className="text-xs text-gray-500">{new Date(answer.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <p className="text-gray-700 mb-4 whitespace-pre-wrap">{answer.content}</p>
                                <div className="flex items-center justify-end">
                                    <button
                                        onClick={() => handleUpvoteAnswer(answer.id)}
                                        className={`flex items-center gap-2 text-sm font-medium transition
                                            ${answer.upvotes?.includes(user?.uid || '') ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                                    >
                                        <ThumbsUp className="w-4 h-4" />
                                        <span>{answer.upvotes?.length || 0}</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Reply Box */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg sticky bottom-6">
                    <form onSubmit={handlePostAnswer} className="flex gap-4">
                        <textarea
                            value={newAnswer}
                            onChange={(e) => setNewAnswer(e.target.value)}
                            placeholder="Add your advice..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-[#A2D2FF] outline-none resize-none"
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={!newAnswer.trim() || isSubmitting}
                            className="bg-[#FF9F1C] text-white p-3 rounded-xl hover:bg-orange-500 disabled:opacity-50 transition shadow-md"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
