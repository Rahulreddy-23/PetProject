import { db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    setDoc,
    deleteDoc,
    writeBatch,
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    increment
} from "firebase/firestore";

// --- Username Management ---

/**
 * Check if a username is available.
 * Usernames are stored lowercase for case-insensitive uniqueness.
 */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
    const normalizedUsername = username.toLowerCase().trim();
    if (!normalizedUsername || normalizedUsername.length < 3) return false;

    // Check for invalid characters (only alphanumeric and underscores)
    if (!/^[a-z0-9_]+$/.test(normalizedUsername)) return false;

    const docRef = doc(db, "usernames", normalizedUsername);
    const docSnap = await getDoc(docRef);
    return !docSnap.exists();
};

/**
 * Claim a username for a user.
 * Uses a batch write to ensure atomicity.
 */
export const claimUsername = async (
    uid: string,
    username: string,
    bio?: string
): Promise<void> => {
    const normalizedUsername = username.toLowerCase().trim();

    const batch = writeBatch(db);

    // 1. Create username document
    const usernameRef = doc(db, "usernames", normalizedUsername);
    batch.set(usernameRef, { uid });

    // 2. Update user profile with username and initialize counts
    const userRef = doc(db, "users", uid);
    batch.update(userRef, {
        username: normalizedUsername,
        bio: bio || "",
        followingCount: 0,
        followersCount: 0
    });

    await batch.commit();
};

// --- Follow System ---

/**
 * Follow a user.
 * Uses a batch write to update both subcollections and counts atomically.
 */
export const followUser = async (currentUid: string, targetUid: string): Promise<void> => {
    if (currentUid === targetUid) return; // Can't follow yourself

    const batch = writeBatch(db);
    const timestamp = new Date().toISOString();

    // 1. Add to current user's following list
    const followingRef = doc(db, "users", currentUid, "following", targetUid);
    batch.set(followingRef, { followedAt: timestamp });

    // 2. Add to target user's followers list
    const followerRef = doc(db, "users", targetUid, "followers", currentUid);
    batch.set(followerRef, { followedAt: timestamp });

    // 3. Increment counts
    const currentUserRef = doc(db, "users", currentUid);
    batch.update(currentUserRef, { followingCount: increment(1) });

    const targetUserRef = doc(db, "users", targetUid);
    batch.update(targetUserRef, { followersCount: increment(1) });

    await batch.commit();
};

/**
 * Unfollow a user.
 * Uses a batch write for atomicity.
 */
export const unfollowUser = async (currentUid: string, targetUid: string): Promise<void> => {
    if (currentUid === targetUid) return;

    const batch = writeBatch(db);

    // 1. Remove from current user's following list
    const followingRef = doc(db, "users", currentUid, "following", targetUid);
    batch.delete(followingRef);

    // 2. Remove from target user's followers list
    const followerRef = doc(db, "users", targetUid, "followers", currentUid);
    batch.delete(followerRef);

    // 3. Decrement counts
    const currentUserRef = doc(db, "users", currentUid);
    batch.update(currentUserRef, { followingCount: increment(-1) });

    const targetUserRef = doc(db, "users", targetUid);
    batch.update(targetUserRef, { followersCount: increment(-1) });

    await batch.commit();
};

/**
 * Check if currentUser is following targetUser.
 */
export const isFollowing = async (currentUid: string, targetUid: string): Promise<boolean> => {
    const followingRef = doc(db, "users", currentUid, "following", targetUid);
    const docSnap = await getDoc(followingRef);
    return docSnap.exists();
};

/**
 * Get a user's followers.
 */
export const getFollowers = async (uid: string, maxResults: number = 50) => {
    const followersCol = collection(db, "users", uid, "followers");
    const q = query(followersCol, orderBy("followedAt", "desc"), limit(maxResults));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.id);
};

/**
 * Get users that a user is following.
 */
export const getFollowing = async (uid: string, maxResults: number = 50) => {
    const followingCol = collection(db, "users", uid, "following");
    const q = query(followingCol, orderBy("followedAt", "desc"), limit(maxResults));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.id);
};

// --- User Search ---

/**
 * Search for users by username prefix.
 * Usernames are stored lowercase for case-insensitive search.
 */
export const searchUsersByUsername = async (prefix: string, maxResults: number = 10) => {
    const normalizedPrefix = prefix.toLowerCase().trim();
    if (!normalizedPrefix) return [];

    // Firestore prefix query trick
    const endPrefix = normalizedPrefix.slice(0, -1) + String.fromCharCode(normalizedPrefix.charCodeAt(normalizedPrefix.length - 1) + 1);

    const usersCol = collection(db, "users");
    const q = query(
        usersCol,
        where("username", ">=", normalizedPrefix),
        where("username", "<", endPrefix),
        limit(maxResults)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
};

/**
 * Get suggested users (users not followed by current user).
 * Simple implementation: returns recent users excluding those already followed.
 */
export const getSuggestedUsers = async (currentUid: string, maxResults: number = 5) => {
    // Get current user's following list
    const following = await getFollowing(currentUid, 100);
    const excludeSet = new Set([...following, currentUid]);

    // Get recent users
    const usersCol = collection(db, "users");
    const q = query(
        usersCol,
        where("username", "!=", null), // Only users who have completed onboarding
        orderBy("username"),
        limit(maxResults + excludeSet.size) // Fetch extra to filter
    );

    const snapshot = await getDocs(q);
    const suggestions = snapshot.docs
        .filter(doc => !excludeSet.has(doc.id))
        .slice(0, maxResults)
        .map(doc => ({ uid: doc.id, ...doc.data() }));

    return suggestions;
};
