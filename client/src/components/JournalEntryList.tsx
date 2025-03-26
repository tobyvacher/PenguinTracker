import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Penguin, SightingJournal } from "@shared/schema";
import { format } from "date-fns";
import { Edit, MapPin, Plus, Trash } from "lucide-react";
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
import JournalEntryForm from './JournalEntryForm';

interface JournalEntryListProps {
  penguin: Penguin;
  onClose?: () => void;
}

export default function JournalEntryList({ penguin, onClose }: JournalEntryListProps) {
  const { toast } = useToast();
  const { 
    getPenguinJournalEntries,
    deleteJournalEntry,
    isDeletingJournalEntry 
  } = useJournal();
  
  // Get journal entries for this penguin
  const { 
    data: journalEntries = [],
    isLoading,
    isError 
  } = getPenguinJournalEntries(penguin.id) || { data: [], isLoading: false, isError: false };
  
  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SightingJournal | null>(null);

  // Handle delete
  const handleDelete = (entryId: number) => {
    deleteJournalEntry(entryId, {
      onSuccess: () => {
        toast({
          title: "Entry deleted",
          description: "Journal entry has been deleted successfully.",
        });
      },
      onError: () => {
        toast({
          title: "Delete failed",
          description: "There was an error deleting the journal entry.",
          variant: "destructive",
        });
      }
    });
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
      <div className="p-4 text-center">
        <p>Loading journal entries...</p>
      </div>
    );
  }
  
  // Show error state
  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error loading journal entries</p>
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
        <div className="py-8 text-center bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-2">No journal entries yet</p>
          <p className="text-sm text-gray-400">
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
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">
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
                        <AlertDialogContent>
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
                  <CardContent className="pt-1 pb-2">
                    <p className="text-sm whitespace-pre-line">{entry.notes}</p>
                  </CardContent>
                )}
                
                {entry.coordinates && (
                  <CardFooter className="pt-0 pb-2 text-xs text-gray-500">
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