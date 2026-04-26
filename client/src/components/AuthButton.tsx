import React from 'react';
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
import { LogIn, LogOut, User } from 'lucide-react';

export default function AuthButton() {
  const { currentUser, signIn, signOut, loading } = useAuth();

  if (loading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <User className="h-5 w-5" />
      </Button>
    );
  }

  if (!currentUser) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={signIn}
        className="flex items-center gap-2"
      >
        <LogIn className="h-4 w-4" />
        <span>Sign In</span>
      </Button>
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
        <DropdownMenuItem onClick={signOut} className="cursor-pointer">
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
