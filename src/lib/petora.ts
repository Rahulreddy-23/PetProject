import { db, storage } from "@/lib/firebase";
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    startAfter,
    getDocs,
    doc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    deleteDoc,
    DocumentData,
    QueryDocumentSnapshot,
    getDoc,
    where,
    increment,
    serverTimestamp
} from "firebase/firestore";
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { Question, Answer } from "@/types/schema";

// --- Media Upload ---

export const uploadQuestionImage = async (file: File, userId: string): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `petora/${userId}/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            null,
            (error) => reject(error),
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
};

// --- Questions ---

export const createQuestion = async (data: Omit<Question, 'id' | 'createdAt' | 'upvotes' | 'answerCount'>): Promise<string> => {
    try {
        // Sanitize
        const sanitizedData = JSON.parse(JSON.stringify(data));

        const docRef = await addDoc(collection(db, "questions"), {
            ...sanitizedData,
            upvotes: [],
            answerCount: 0,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating question:", error);
        throw error;
    }
};

export const getQuestions = async (lastDoc?: QueryDocumentSnapshot<DocumentData>, pageSize: number = 10) => {
    try {
        let q = query(
            collection(db, "questions"),
            orderBy("createdAt", "desc"),
            limit(pageSize)
        );

        if (lastDoc) {
            q = query(
                collection(db, "questions"),
                orderBy("createdAt", "desc"),
                startAfter(lastDoc),
                limit(pageSize)
            );
        }

        const snapshot = await getDocs(q);
        const questions: Question[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Question));

        return { questions, lastVisible: snapshot.docs[snapshot.docs.length - 1] };
    } catch (error) {
        console.error("Error fetching questions:", error);
        throw error;
    }
};

export const getQuestion = async (id: string): Promise<Question | null> => {
    try {
        const docRef = doc(db, "questions", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Question;
        }
        return null;
    } catch (error) {
        console.error("Error fetching question:", error);
        throw error;
    }
};

export const deleteQuestion = async (questionId: string, userId: string, imageUrl?: string): Promise<void> => {
    try {
        // Delete Firestore doc
        await deleteDoc(doc(db, "questions", questionId));

        // Delete Image if exists
        if (imageUrl) {
            const fileRef = ref(storage, imageUrl);
            await deleteObject(fileRef).catch(e => console.warn("Image delete failed (ignore if not found):", e));
        }
    } catch (error) {
        console.error("Error deleting question:", error);
        throw error;
    }
};

// --- Answers ---

export const addAnswer = async (data: Omit<Answer, 'id' | 'createdAt' | 'upvotes'>): Promise<string> => {
    try {
        // Sanitize
        const sanitizedData = JSON.parse(JSON.stringify(data));

        const docRef = await addDoc(collection(db, "answers"), {
            ...sanitizedData,
            upvotes: [],
            createdAt: new Date().toISOString()
        });

        // Increment answer count on question
        const qRef = doc(db, "questions", data.questionId);
        await updateDoc(qRef, {
            answerCount: increment(1)
        });

        return docRef.id;
    } catch (error) {
        console.error("Error adding answer:", error);
        throw error;
    }
};

export const getAnswers = async (questionId: string): Promise<Answer[]> => {
    try {
        const q = query(
            collection(db, "answers"),
            where("questionId", "==", questionId),
            orderBy("createdAt", "asc") // Oldest first (chronological conversation)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Answer));
    } catch (error) {
        console.error("Error fetching answers:", error);
        throw error;
    }
};

// --- Voting ---

export const toggleQuestionUpvote = async (questionId: string, userId: string): Promise<void> => {
    try {
        const docRef = doc(db, "questions", questionId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const upvotes = data.upvotes || [];

            if (upvotes.includes(userId)) {
                await updateDoc(docRef, { upvotes: arrayRemove(userId) });
            } else {
                await updateDoc(docRef, { upvotes: arrayUnion(userId) });
            }
        }
    } catch (error) {
        console.error("Error voting on question:", error);
        throw error;
    }
};

export const toggleAnswerUpvote = async (answerId: string, userId: string): Promise<void> => {
    try {
        const docRef = doc(db, "answers", answerId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const upvotes = data.upvotes || [];

            if (upvotes.includes(userId)) {
                await updateDoc(docRef, { upvotes: arrayRemove(userId) });
            } else {
                await updateDoc(docRef, { upvotes: arrayUnion(userId) });
            }
        }
    } catch (error) {
        console.error("Error voting on answer:", error);
        throw error;
    }
};
