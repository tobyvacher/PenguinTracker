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

  // Create or get user in the backend when a user signs in
  const createOrGetUser = async (user: User) => {
    try {
      const token = await user.getIdToken();
      await apiRequest('/api/users', 'POST', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error creating/getting user:', error);
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
    } catch (error) {
      console.error('Error signing in:', error);
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