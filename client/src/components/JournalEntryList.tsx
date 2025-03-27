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
  
  // Get journal entries for this penguin
  const { 
    data: journalEntries = [],
    isLoading,
    isError,
    error
  } = getPenguinJournalEntries(penguin.id) || { data: [], isLoading: false, isError: false };
  
  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SightingJournal | null>(null);

  // Handle delete
  const handleDelete = (entryId: number) => {
    // Pass the penguin ID for better cache invalidation
    deleteJournalEntry(entryId, penguin.id);
  };

  // Form handlers
  const handleAddComplete = () => {
    setShowAddForm(false);
  };

  const handleEditComplete = () => {
    setEditingEntry(null);
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
  
  // Show error state
  if (isError) {
    // Check if this is a Firestore index error
    const isIndexError = error?.message?.includes('index');
    
    return (
      <div className="p-4 text-center space-y-3">
        <p className="text-red-500 font-medium">Error loading journal entries</p>
        
        {isIndexError ? (
          <>
            <p className="text-sm text-gray-600">
              This looks like a Firestore index error. For the journal feature to work properly, 
              you need to create specific indexes in your Firebase console.
            </p>
            <div className="bg-gray-50 p-3 rounded-md text-xs text-left">
              <p className="font-medium mb-1">How to fix:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Go to your Firebase console</li>
                <li>Navigate to Firestore Database → Indexes</li>
                <li>Add the required composite indexes for the journal_entries collection</li>
              </ol>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Something went wrong while loading the journal entries.
          </p>
        )}
        
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  // If showing add/edit form
  if (showAddForm) {
    return (
      <div className="p-4">
        <JournalEntryForm 
          penguin={penguin}
          onComplete={handleAddComplete}
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
          onComplete={handleEditComplete}
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
        <h3 className="text-lg font-semibold">
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
                        className="h-8 w-8"
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