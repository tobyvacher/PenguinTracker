import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser, onAuthStateChange, firebaseConfigValid } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  firebaseAvailable: boolean;
}

// Create a default context to avoid the "useAuth must be used within an AuthProvider" error
const defaultContext: AuthContextType = {
  currentUser: null,
  loading: true,
  signIn: async () => {
    console.error("Auth context not initialized properly");
    return null;
  },
  signOut: async () => {
    console.error("Auth context not initialized properly");
  },
  isAuthenticated: false,
  firebaseAvailable: false
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firebaseAvailable, setFirebaseAvailable] = useState(firebaseConfigValid);

  // Create or get user in both the backend API and Firestore when a user signs in
  const createOrGetUser = async (user: User) => {
    try {
      console.log("Creating/getting user in backend and Firestore:", user.uid);
      
      // Get token first - this will verify the user is properly authenticated
      let token;
      try {
        token = await user.getIdToken(true); // Force refresh the token
        console.log("Successfully obtained authentication token");
      } catch (tokenError) {
        console.error("Failed to get auth token:", tokenError);
        throw new Error("Authentication token could not be retrieved. Please try signing in again.");
      }
      
      // 1. First create user in the API backend
      try {
        const apiUser = await apiRequest('/api/users', 'POST', {}, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log("User created/retrieved in API backend:", apiUser);
      } catch (apiError) {
        console.error("Error creating user in API backend:", apiError);
        // Continue even if API fails, as we can still use Firebase directly
      }
      
      // 2. Also create the user in Firestore directly
      try {
        // Import firestoreStorage dynamically to avoid circular dependencies
        const { firestoreStorage } = await import('@/lib/firestore-storage');
        
        if (firestoreStorage) {
          // Create the user in Firestore if it doesn't exist
          await firestoreStorage.createUser({
            firebaseUid: user.uid,
            displayName: user.displayName || null,
            email: user.email || null,
            photoURL: user.photoURL || null,
            seenPenguins: [] // Initialize with empty array
          });
          
          console.log("User created/retrieved in Firestore successfully");
        } else {
          console.error("firestoreStorage is not available");
        }
      } catch (firestoreError) {
        console.error("Error creating user in Firestore:", firestoreError);
        // Don't throw here, we want to continue even if Firestore fails
      }
      
      return user;
    } catch (error) {
      console.error('Error creating/getting user:', error);
      throw error; // Re-throw to handle in the UI
    }
  };

  useEffect(() => {
    // Check if Firebase is correctly configured
    setFirebaseAvailable(firebaseConfigValid);
    
    if (!firebaseConfigValid) {
      console.warn("Firebase is not properly configured. Some features may not work.");
      setLoading(false);
      return () => {};
    }
    
    // Set up the auth state listener
    try { 
      const unsubscribe = onAuthStateChange(async (user) => {
        console.log("Auth state changed:", user ? `User ${user.uid} signed in` : "No user");
        setCurrentUser(user);
        
        if (user) {
          try {
            await createOrGetUser(user);
            // Invalidate queries that depend on authentication
            queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
            queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
          } catch (error) {
            console.error("Error in auth state change handler:", error);
          }
        }
        
        // Set loading to false once auth state is initialized
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up auth state listener:", error);
      setLoading(false);
      return () => {};
    }
  }, []);

  const signIn = async () => {
    try {
      if (!firebaseConfigValid) {
        throw new Error("Firebase is not properly configured. Please check your environment variables.");
      }
      
      // Using popup flow - this will immediately return the user
      const user = await signInWithGoogle();
      if (user) {
        await createOrGetUser(user);
        // Invalidate queries that depend on authentication
        queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
        queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
      }
      return user;
    } catch (error: any) {
      console.error('Error signing in:', error);
      
      // Better error handling for common Firebase auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Sign-in popup was closed by the user before completing the sign-in process.');
      } else if (error.code === 'auth/popup-blocked') {
        alert('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        alert(`This domain (${currentDomain}) is not authorized for Firebase authentication. Please add it to your Firebase authorized domains list.`);
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('Multiple popup requests were made. The latest request canceled the previous one.');
      } else if (error.code === 'auth/internal-error') {
        // This often indicates environment variables or config issues
        console.error('Firebase internal error. Check that all environment variables are set correctly.');
      }
      
      // Re-throw the error so the UI can handle it
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (!firebaseConfigValid) {
        throw new Error("Firebase is not properly configured. Please check your environment variables.");
      }
      
      await signOutUser();
      // Invalidate queries that depend on authentication
      queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/journal'] });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!currentUser,
    firebaseAvailable: firebaseAvailable
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};