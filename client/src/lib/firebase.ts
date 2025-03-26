import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  Timestamp
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if Firebase configuration is valid
const isConfigValid = 
  !!import.meta.env.VITE_FIREBASE_API_KEY && 
  !!import.meta.env.VITE_FIREBASE_PROJECT_ID && 
  !!import.meta.env.VITE_FIREBASE_APP_ID;

// Debug environment variables without exposing actual values
const envCheck = {
  VITE_FIREBASE_API_KEY: !!import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_PROJECT_ID: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_APP_ID: !!import.meta.env.VITE_FIREBASE_APP_ID
};
console.log("Environment variables present:", envCheck);

// Initialize Firebase
let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;
let db: ReturnType<typeof getFirestore> | undefined;
let googleProvider: GoogleAuthProvider | undefined;

try {
  if (!isConfigValid) {
    console.error("Firebase configuration is invalid. Missing environment variables.", envCheck);
    console.log("Current host:", window.location.hostname);
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    console.log("Firebase initialized successfully");
    // Log auth domain for debugging
    console.log(`Auth domain being used: ${firebaseConfig.authDomain}`);
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Export config validity for components that need to know
export const firebaseConfigValid = isConfigValid;

// Sign in with Google using popup (better for Replit environment)
export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error("Firebase authentication not initialized. Check your environment variables.");
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// This function is kept for backward compatibility
export const handleRedirectResult = async () => {
  // No longer needed with popup flow, but kept for API compatibility
  return null;
};

// Sign out
export const signOutUser = async () => {
  if (!auth) {
    throw new Error("Firebase authentication not initialized");
  }
  
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth?.currentUser || null;
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    console.error("Firebase authentication not initialized");
    return () => {}; // Return a no-op unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};

export { auth, db };