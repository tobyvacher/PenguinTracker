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

  const createOrGetUser = async (user: User) => {
    try {
      const token = await user.getIdToken();
      const apiUser = await apiRequest('/api/users', 'POST', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Also ensure user exists in Firestore
      try {
        const { firestoreStorage } = await import('@/lib/firestore-storage');
        if (firestoreStorage) {
          await firestoreStorage.createUser({
            firebaseUid: user.uid,
            displayName: user.displayName || null,
            email: user.email || null,
            photoURL: user.photoURL || null,
            seenPenguins: [],
          });
        }
      } catch (firestoreError) {
        // Non-fatal: app continues without Firestore user record
        console.error("Error creating user in Firestore:", firestoreError);
      }

      return apiUser;
    } catch (error) {
      console.error('Error creating/getting user:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          await createOrGetUser(user);
        } catch (error) {
          console.error('Error syncing user on auth state change:', error);
        }
        queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      const user = await signInWithGoogle();
      // createOrGetUser is handled by the onAuthStateChange listener above,
      // so we don't call it again here to avoid duplicate requests.
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
      }
      return user;
    } catch (error: any) {
      console.error('Error signing in:', error);

      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // User dismissed the popup — no action needed
        return null;
      } else if (error.code === 'auth/popup-blocked') {
        // Surface a user-friendly message without blocking alert()
        console.warn('Sign-in popup was blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/unauthorized-domain') {
        console.error(`Domain ${window.location.hostname} is not authorized for Firebase authentication.`);
      } else if (error.code === 'auth/internal-error') {
        console.error('Firebase internal error. Check that all environment variables are set correctly.');
      }

      throw error;
    }
  };

  const signOut = async () => {
    try {
      await signOutUser();
      queryClient.invalidateQueries({ queryKey: ['/api/seen-penguins'] });
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
