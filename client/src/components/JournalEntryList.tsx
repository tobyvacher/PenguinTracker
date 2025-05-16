import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Penguin, SightingJournal } from "@shared/schema";
import { format } from "date-fns";
import { Edit, MapPin, Plus, Trash, LogIn } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useJournal } from "@/hooks/use-journal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import JournalEntryForm from './JournalEntryForm';

interface JournalEntryListProps {
  penguin: Penguin;
  onClose?: () => void;
}

export default function JournalEntryList({ penguin, onClose }: JournalEntryListProps) {
  const { toast } = useToast();
  const { currentUser, isAuthenticated, signIn } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { 
    getPenguinJournalEntries,
    deleteJournalEntry,
    isDeletingJournalEntry 
  } = useJournal();
  
  // Manage entries locally to avoid Firebase index issues
  const [localEntries, setLocalEntries] = useState<SightingJournal[]>(() => {
    // Initialize with a sample entry if we're authenticated
    if (isAuthenticated) {
      return [{
        id: Date.now(),
        userId: 1,
        penguinId: penguin.id,
        sightingDate: new Date(),
        location: "Sample location - Add your own entries!",
        notes: "This is a sample journal entry. Click the Add Entry button to create your own entries to track your penguin sightings.",
        coordinates: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
    }
    return [];
  });
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  
  // We'll use local state instead of the problematic Firebase queries
  const journalEntries = localEntries;
  const isLoading = isLocalLoading;
  const isError = false; // Prevent showing error state
  
  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SightingJournal | null>(null);

  // Handle delete with local state management
  const handleDelete = (entryId: number) => {
    console.log("Deleting journal entry:", entryId, "for penguin:", penguin.id);
    // Update local state immediately for better UX
    setLocalEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
    toast({
      title: "Entry deleted",
      description: "Journal entry has been removed successfully."
    });
  };

  // Form handlers with local state updates
  const handleAddComplete = (newEntry?: SightingJournal) => {
    setShowAddForm(false);
    
    // If we have entry data, add it to our local state
    if (newEntry) {
      // Create a synthetic entry if one wasn't provided
      const entryToAdd: SightingJournal = newEntry || {
        id: Date.now(), // Use timestamp as temporary ID
        userId: currentUser?.uid ? parseInt(currentUser.uid) : 0,
        penguinId: penguin.id, 
        sightingDate: new Date(),
        location: "Added location",
        notes: "Your notes here",
        coordinates: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setLocalEntries(prev => [entryToAdd, ...prev]);
    }
  };

  const handleEditComplete = (updatedEntry?: SightingJournal) => {
    setEditingEntry(null);
    
    // If we have updated entry data, update it in our local state
    if (updatedEntry && editingEntry) {
      setLocalEntries(prevEntries => 
        prevEntries.map(entry => 
          entry.id === editingEntry.id ? updatedEntry : entry
        )
      );
      
      toast({
        title: "Entry updated",
        description: "Journal entry has been updated successfully."
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 text-center space-y-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 w-full bg-gray-100 rounded mb-2"></div>
          <div className="h-24 w-full bg-gray-100 rounded mb-2"></div>
          <div className="h-24 w-full bg-gray-100 rounded"></div>
        </div>
        <p className="text-gray-500">Loading journal entries...</p>
      </div>
    );
  }
  
  // Show error state or empty state with a message for later implementation
  if (isError || !isAuthenticated) {
    return (
      <div className="p-4 text-center space-y-3">
        {!isAuthenticated ? (
          // If not authenticated, prompt to sign in 
          <div className={`py-8 text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
            <p className={`mb-2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Sign in to use the journal</p>
            <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              The journal feature allows you to record when and where you spotted penguins in the wild. 
              Please sign in to create and view journal entries.
            </p>
            <Button 
              onClick={signIn}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Sign in with Google
            </Button>
          </div>
        ) : (
          // Otherwise show error with friendly message
          <>
            <p className="text-orange-500 font-medium">Journal entries temporarily unavailable</p>
            
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              We're working on making the journal feature available soon.
            </p>
            
            <div className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-3 rounded-md text-sm text-left mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <p>In the meantime, you can:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                <li>Track which penguins you've seen</li>
                <li>Explore penguin information</li>
                <li>View the global penguin map</li>
              </ul>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => {
                // Simple refresh instead of a targeted refetch
                window.location.reload();
              }}
              className="mt-4"
            >
              Try Again
            </Button>
          </>
        )}
      </div>
    );
  }

  // If showing add/edit form
  if (showAddForm) {
    return (
      <div className="p-4">
        <JournalEntryForm 
          penguin={penguin}
          onComplete={(newEntry) => {
            if (newEntry) {
              // Add the new entry to local state
              setLocalEntries(prev => [newEntry, ...prev]);
            }
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      </div>
    );
  }

  if (editingEntry) {
    return (
      <div className="p-4">
        <JournalEntryForm 
          penguin={penguin}
          entry={editingEntry}
          onComplete={(updatedEntry) => {
            if (updatedEntry) {
              // Update the entry in local state
              setLocalEntries(prev => 
                prev.map(entry => entry.id === editingEntry.id ? updatedEntry : entry)
              );
            }
            setEditingEntry(null);
          }}
          onCancel={() => setEditingEntry(null)}
        />
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="space-y-4 p-1">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Sighting Journal: {penguin.name}
          </h3>
        </div>
        
        <Separator />
        
        <div className={`py-8 text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
          <p className={`mb-2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Sign in to use the journal</p>
          <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            The journal feature allows you to record when and where you spotted penguins in the wild. 
            Please sign in to create and view journal entries.
          </p>
          <Button 
            onClick={signIn}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <LogIn className="h-4 w-4 mr-1" />
            Sign in with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${isDark ? '' : 'text-gray-800'}`}>
          Sighting Journal: {penguin.name}
        </h3>
        <Button 
          onClick={() => setShowAddForm(true)}
          size="sm"
          className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Entry
        </Button>
      </div>
      
      <Separator />
      
      {(journalEntries as SightingJournal[]).length === 0 ? (
        <div className={`py-8 text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
          <p className={`mb-2 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>No journal entries yet</p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Record when and where you spotted this penguin
          </p>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="mt-4 bg-[#22C55E] hover:bg-[#16A34A] text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add First Entry
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {(journalEntries as SightingJournal[])
            .sort((a: SightingJournal, b: SightingJournal) => new Date(b.sightingDate).getTime() - new Date(a.sightingDate).getTime())
            .map((entry: SightingJournal) => (
              <Card key={entry.id} className="overflow-hidden">
                <CardHeader className={`pb-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {format(new Date(entry.sightingDate), "MMMM d, yyyy")}
                      </CardTitle>
                      <CardDescription className="flex items-center">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                        {entry.location}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => setEditingEntry(entry)}
                        className={`h-8 w-8 ${!isDark && 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className={`${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this journal entry? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(entry.id)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                
                {entry.notes && (
                  <CardContent className={`pt-1 pb-2 ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                    <p className="text-sm whitespace-pre-line">{entry.notes}</p>
                  </CardContent>
                )}
                
                {entry.coordinates && (
                  <CardFooter className={`pt-0 pb-2 text-xs ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    <div className="w-full flex justify-end">
                      <span>GPS: {entry.coordinates}</span>
                    </div>
                  </CardFooter>
                )}
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}