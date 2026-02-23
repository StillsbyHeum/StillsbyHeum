import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, setPersistence, browserSessionPersistence, User } from 'firebase/auth';

// Replace these with your Firebase project configuration
const firebaseConfig = {
    apiKey: (import.meta as any).env.VITE_FIREBASE_API_KEY,
    authDomain: (import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: (import.meta as any).env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: (import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: (import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: (import.meta as any).env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
let app;
let auth: any;
let googleProvider: any;

const isValidKey = (key: string | undefined) => {
    return key && key.length > 10 && !key.includes("undefined") && !key.includes("placeholder");
};

try {
    if (!isValidKey(firebaseConfig.apiKey)) {
        console.warn("Firebase API key is missing or invalid. Authentication will not work.");
        // Mock auth object to prevent crashes
        auth = {
            currentUser: null,
            onAuthStateChanged: (callback: any) => { callback(null); return () => {}; },
            signOut: async () => {},
            signInWithPopup: async () => { throw new Error("Firebase API key is missing."); }
        };
    } else {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();
    }
} catch (error) {
    console.error("Firebase initialization failed:", error);
    // Fallback mock auth
    auth = {
        currentUser: null,
        onAuthStateChanged: (callback: any) => { callback(null); return () => {}; },
        signOut: async () => {},
        signInWithPopup: async () => { throw new Error("Firebase initialization failed."); }
    };
}

// Allowed Admin Emails (Strict Whitelist)
const ALLOWED_ADMINS = [
    "maximinimum9@gmail.com", // Your email
    // Add other authorized emails here
];

export const loginWithGoogle = async (): Promise<boolean> => {
    if (!isValidKey(firebaseConfig.apiKey)) {
        console.warn("Invalid API Key. Using Mock Login for Dev.");
        // Throw specific error to trigger Dev Mode UI
        throw new Error("DEV_MODE_REQUIRED");
    }

    try {
        // Set persistence to SESSION (clears when tab/window closes)
        await setPersistence(auth, browserSessionPersistence);
        
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        if (user.email && ALLOWED_ADMINS.includes(user.email)) {
            return true;
        } else {
            await signOut(auth); // Immediately sign out unauthorized users
            throw new Error("Unauthorized access: Your email is not on the admin whitelist.");
        }
    } catch (error: any) {
        console.error("Login failed:", error);
        
        // Check for specific Firebase error codes or messages indicating invalid config
        const errorCode = error.code || '';
        const errorMessage = error.message || '';
        
        if (
            errorCode === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
            errorCode === 'auth/invalid-api-key' ||
            errorMessage.includes('api-key-not-valid') ||
            errorMessage.includes('invalid-api-key')
        ) {
             throw new Error("DEV_MODE_REQUIRED");
        }
        throw error; 
    }
};

export const getMockUser = () => ({
    uid: "dev-admin",
    email: "maximinimum9@gmail.com",
    displayName: "Dev Admin",
    emailVerified: true
} as User);

export const logoutAdmin = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
    }
};

export const checkAdminAuth = (user: User | null): boolean => {
    return !!user && !!user.email && ALLOWED_ADMINS.includes(user.email);
};

export { auth };
