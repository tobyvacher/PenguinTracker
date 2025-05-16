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
    
    // Verify Firestore is initialized
    if (db) {
      console.log("Firestore db instance is properly initialized");
      
      // Test if we can communicate with Firestore by trying to access a collection
      try {
        const testCollection = collection(db, 'test_connectivity');
        console.log("Successfully accessed Firestore collection reference:", testCollection.id);
        
        // Import the validate rules function dynamically to avoid circular dependencies
        import('./firestore-storage').then(async (module) => {
          if (module.validateFirestoreRules) {
            const rulesValid = await module.validateFirestoreRules();
            console.log("Firestore rules validation result:", rulesValid ? "VALID" : "INVALID");
          }
        }).catch(error => {
          console.error("Error importing validateFirestoreRules:", error);
        });
      } catch (error) {
        console.error("Error accessing Firestore collection:", error);
      }
    } else {
      console.error("Firestore db instance is NOT initialized properly");
    }
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Export config validity for components that need to know
export const firebaseConfigValid = isConfigValid;

// Sign in with Google using popup (better for Replit environment)
export const signInWithGoogle = async () => {
  console.log("Starting Google sign-in process");
  
  if (!auth || !googleProvider) {
    console.error("Firebase auth or Google provider not initialized", {
      authExists: !!auth,
      googleProviderExists: !!googleProvider
    });
    throw new Error("Firebase authentication not initialized. Check your environment variables.");
  }

  // Provide better diagnostics about the environment 
  console.log("Firebase auth state before sign-in:", {
    currentUser: auth.currentUser ? {
      uid: auth.currentUser.uid,
      isAnonymous: auth.currentUser.isAnonymous,
      emailVerified: auth.currentUser.emailVerified
    } : null,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    currentDomain: window.location.hostname
  });

  // Add Google OAuth scopes for better user experience
  googleProvider.addScope('profile');
  googleProvider.addScope('email');
  
  // Set custom parameters for the auth provider
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    console.log("Calling signInWithPopup...");
    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign-in successful:", result.user.uid);
    return result.user;
  } catch (error: any) {
    console.error("Detailed sign-in error:", { 
      code: error.code,
      message: error.message,
      email: error.email,
      credential: error.credential ? "present" : "missing"
    });
    
    // Alert on common errors to help debugging
    if (error.code === 'auth/unauthorized-domain') {
      console.error(`DOMAIN ERROR: ${window.location.hostname} is not authorized in Firebase console`);
    } else if (error.code === 'auth/internal-error') {
      console.error("Firebase internal error. Check environment variables and browser console.");
    }
    
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

// Make Firebase available globally for debugging
declare global {
  interface Window {
    firebase?: {
      auth?: typeof auth;
      db?: typeof db;
      firestore?: any;
    };
  }
}

// Attach Firebase to window object for debugging
if (isConfigValid && typeof window !== 'undefined') {
  window.firebase = {
    auth,
    db,
    firestore: {
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
    }
  };
  console.log('Firebase attached to window object for debugging');
}