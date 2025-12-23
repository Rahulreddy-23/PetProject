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
    serverTimestamp,
    getDoc,
    where
} from "firebase/firestore";
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { Post, Comment } from "@/types/schema";

export const uploadMedia = async (file: File, userId: string): Promise<string> => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}. Allowed: images (jpeg, png, webp) and video (mp4, webm).`);
    }

    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `petbook/${userId}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progress monitoring (optional here, handled in component)
            },
            (error) => {
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
};

export const createPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'likes'>): Promise<string> => {
    try {
        // Sanitize data to remove undefined values (e.g. petId)
        const sanitizedData = JSON.parse(JSON.stringify(postData));

        const docRef = await addDoc(collection(db, "posts"), {
            ...sanitizedData,
            likes: [], // Initialize empty
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating post:", error);
        throw error;
    }
};

export const getPosts = async (lastDoc?: QueryDocumentSnapshot<DocumentData>, pageSize: number = 5) => {
    try {
        let q = query(
            collection(db, "posts"),
            orderBy("createdAt", "desc"),
            limit(pageSize)
        );

        if (lastDoc) {
            q = query(
                collection(db, "posts"),
                orderBy("createdAt", "desc"),
                startAfter(lastDoc),
                limit(pageSize)
            );
        }

        const snapshot = await getDocs(q);
        const posts: Post[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Post));

        return { posts, lastVisible: snapshot.docs[snapshot.docs.length - 1] };
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
};

export const toggleLike = async (postId: string, userId: string): Promise<void> => {
    try {
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);

        if (postSnap.exists()) {
            const data = postSnap.data();
            const likes = data.likes || [];

            if (likes.includes(userId)) {
                await updateDoc(postRef, {
                    likes: arrayRemove(userId)
                });
            } else {
                await updateDoc(postRef, {
                    likes: arrayUnion(userId)
                });
            }
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        throw error;
    }
};

export const addComment = async (commentData: Omit<Comment, 'id' | 'createdAt'>): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, "comments"), {
            ...commentData,
            createdAt: new Date().toISOString()
        });
        return docRef.id;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

export const getCommentsForPost = async (postId: string): Promise<Comment[]> => {
    try {
        const q = query(
            collection(db, "comments"),
            where("postId", "==", postId),
            orderBy("createdAt", "asc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Comment));
    } catch (error) {
        console.error("Error fetching comments:", error);
        return [];
    }
}

export const deletePost = async (postId: string, userId: string, mediaUrl: string): Promise<void> => {
    try {
        // 1. Delete from Firestore
        await deleteDoc(doc(db, "posts", postId));

        // 2. Delete from Storage
        const fileRef = ref(storage, mediaUrl);
        await deleteObject(fileRef);
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
};
