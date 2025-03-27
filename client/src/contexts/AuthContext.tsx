import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser, onAuthStateChange } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: () => Promise<User | null>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Create or get user in both the backend API and Firestore when a user signs in
  const createOrGetUser = async (user: User) => {
    try {
      console.log("Creating/getting user in backend and Firestore:", user.uid);
      
      // 1. First create user in the API backend
      const token = await user.getIdToken();
      const apiUser = await apiRequest('/api/users', 'POST', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log("User created/retrieved in API backend:", apiUser);
      
      // 2. Also create the user in Firestore directly
      try {
        // Import firestoreStorage dynamically to avoid circular dependencies
        const { firestoreStorage } = await import('@/lib/firestore-storage');
        
        if (firestoreStorage) {
          // Create the user in Firestore if it doesn't exist
          // Create user with the fields that match InsertUser type
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
      
      return apiUser;
    } catch (error) {
      console.error('Error creating/getting user:', error);
      throw error; // Re-throw to handle in the UI
    }
  };

  useEffect(() => {
    // Set up the auth state listener 
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await createOrGetUser(user);
        // Invalidate queries that depend on authentication
        queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
      }
      
      // Set loading to false once auth state is initialized
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      // Using popup flow - this will immediately return the user
      const user = await signInWithGoogle();
      if (user) {
        await createOrGetUser(user);
        // Invalidate queries that depend on authentication
        queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
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
      await signOutUser();
      // Invalidate queries that depend on authentication
      queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};