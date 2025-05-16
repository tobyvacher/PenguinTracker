import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogIn, LogOut, User, AlertCircle } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function AuthButton() {
  const { currentUser, signIn, signOut, loading } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      console.log("Auth button: Starting sign-in process");
      setAuthError(null);
      
      // Since we know the direct Firebase authentication works (from the debugger),
      // let's use it directly here instead of going through the context
      const { signInWithGoogle } = await import('@/lib/firebase');
      
      // Use the working Firebase function directly
      const user = await signInWithGoogle();
      console.log("Auth button: Sign-in successful", user ? user.uid : "No user returned");
      
      // Refresh the page to make sure everything is synced
      window.location.reload();
    } catch (error: any) {
      console.error('Auth button: Error signing in:', error);
      
      // Enhanced error handling
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setAuthError(`Your domain (${currentDomain}) needs to be added to Firebase authorized domains list.`);
      } else if (error.code === 'auth/network-request-failed') {
        setAuthError('Network connection error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/internal-error') {
        setAuthError('Firebase internal error. Check that environment variables are set correctly.');
      } else if (error.message?.includes('apiKey') || error.message?.includes('config') || error.message?.includes('initialized')) {
        setAuthError('Firebase configuration error. Please make sure all required environment variables are set correctly.');
        console.error('Firebase config error details:', error);
      } else {
        setAuthError(error.message || 'Authentication error');
      }
      
      // Force render the error element by rerendering
      setTimeout(() => {
        // This forces React to rerender the component with the error
        setAuthError(prev => prev);
      }, 100);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <User className="h-5 w-5" />
      </Button>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSignIn}
          className="flex items-center gap-2"
        >
          <LogIn className="h-4 w-4" />
          <span>Sign In</span>
        </Button>
        
        {authError && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-red-500 cursor-help">
                  <AlertCircle className="h-5 w-5" />
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs bg-white p-2 shadow-lg rounded border">
                <p className="text-sm">
                  {authError}<br/><br/>
                  {authError.includes('domain') && (
                    <>
                      Go to Firebase console &gt; Authentication &gt; Settings &gt; 
                      Authorized domains and add your Replit domain.
                    </>
                  )}
                  {authError.includes('variables') && (
                    <>
                      Make sure all Firebase environment variables are set in your deployment:
                      VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID
                    </>
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
          <Avatar>
            <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || 'User'} />
            <AvatarFallback>
              {currentUser.displayName 
                ? currentUser.displayName.charAt(0).toUpperCase() 
                : currentUser.email?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          {currentUser.displayName || currentUser.email || 'User'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}