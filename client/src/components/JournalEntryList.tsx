import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Penguin, SightingJournal } from "@shared/schema";
import { format } from "date-fns";
import { Edit, MapPin, Plus, Trash, LogIn } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import JournalEntryForm from './JournalEntryForm';

interface JournalEntryListProps {
  penguin: Penguin;
  onClose?: () => void;
}

export default function JournalEntryList({ penguin }: JournalEntryListProps) {
  const { toast } = useToast();
  const { isAuthenticated, signIn } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [entries, setEntries] = useState<SightingJournal[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SightingJournal | null>(null);

  if (!isAuthenticated) {
    return (
      <div className={`py-8 text-center ${isDark ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg`}>
        <p className={`mb-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Sign in to use the journal</p>
        <p className={`text-sm max-w-md mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          The journal feature lets you record when and where you spotted penguins in the wild.
        </p>
        <Button
          onClick={signIn}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <LogIn className="h-4 w-4 mr-1" />
          Sign in with Google
        </Button>
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="p-4">
        <JournalEntryForm
          penguin={penguin}
          onComplete={(newEntry) => {
            if (newEntry) setEntries(prev => [newEntry, ...prev]);
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
              setEntries(prev => prev.map(e => e.id === editingEntry.id ? updatedEntry : e));
              toast({ title: "Entry updated", description: "Journal entry has been updated." });
            }
            setEditingEntry(null);
          }}
          onCancel={() => setEditingEntry(null)}
        />
      </div>
    );
  }

  const handleDelete = (entryId: number) => {
    setEntries(prev => prev.filter(e => e.id !== entryId));
    toast({ title: "Entry deleted", description: "Journal entry has been removed." });
  };

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <h3 className={`text-lg font-semibold ${isDark ? '' : 'text-gray-800'}`}>
          Sighting Journal
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

      {entries.length === 0 ? (
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
          {[...entries]
            .sort((a, b) => new Date(b.sightingDate).getTime() - new Date(a.sightingDate).getTime())
            .map((entry) => (
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
                        <AlertDialogContent className={isDark ? 'bg-gray-800' : 'bg-white'}>
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
