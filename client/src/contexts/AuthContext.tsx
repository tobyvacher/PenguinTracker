import React, { createContext, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@shared/schema';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signIn: () => void;
  signOut: () => void;
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

async function fetchCurrentUser(): Promise<User | null> {
  const response = await fetch('/api/users/me', { credentials: 'include' });
  if (response.status === 401 || response.status === 404) return null;
  if (!response.ok) return null;
  return response.json();
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const { data: currentUser = null, isLoading: loading } = useQuery<User | null>({
    queryKey: ['/api/users/me'],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const signIn = () => {
    window.location.href = '/api/login';
  };

  const signOut = () => {
    queryClient.setQueryData(['/api/users/me'], null);
    window.location.href = '/api/logout';
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
