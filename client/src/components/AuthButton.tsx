import React from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function AuthButton() {
  const { currentUser, signIn, signOut, loading } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn();
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  if (currentUser) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 hover:bg-gray-100"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || 'User'} />
              <AvatarFallback>
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium">
              {currentUser.displayName || 'User'}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-medium">{currentUser.displayName || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
          </div>
          <div className="p-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Sign out
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        onClick={handleSignIn}
        variant="outline"
        size="sm"
        className="flex items-center border-gray-300 hover:border-gray-400 hover:bg-gray-50"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <LogIn className="h-4 w-4 mr-2" />
        )}
        Sign in with Google
      </Button>
    </motion.div>
  );
}