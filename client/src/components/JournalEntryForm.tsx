import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Map, Save, X } from "lucide-react";
import { format } from "date-fns";
import { InsertSightingJournal, Penguin, SightingJournal } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useJournal } from "@/hooks/use-journal";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

interface JournalEntryFormProps {
  penguin: Penguin;
  entry?: SightingJournal; // Optional for editing existing entry
  onComplete: () => void;
  onCancel: () => void;
}

export default function JournalEntryForm({ 
  penguin, 
  entry, 
  onComplete, 
  onCancel 
}: JournalEntryFormProps) {
  const { toast } = useToast();
  const { addJournalEntry, updateJournalEntry, isAddingJournalEntry, isUpdatingJournalEntry } = useJournal();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isEditing = !!entry;
  
  // Form state
  const [date, setDate] = useState<Date>(entry?.sightingDate ? new Date(entry.sightingDate) : new Date());
  const [location, setLocation] = useState(entry?.location || '');
  const [notes, setNotes] = useState(entry?.notes || '');
  const [coordinates, setCoordinates] = useState(entry?.coordinates || '');
  
  // Track form validity
  const isValid = location.trim().length > 0;
  
  // Handle getting current location
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoordinates(`${latitude},${longitude}`);
          toast({
            title: "Location detected",
            description: "Your current location has been added to the journal entry.",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location error",
            description: "Unable to get your current location. Please enter location manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by your browser. Please enter location manually.",
        variant: "destructive",
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) {
      toast({
        title: "Invalid form",
        description: "Please provide a location for your sighting.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure date is a valid Date object before submission
    const validDate = date instanceof Date && !isNaN(date.getTime()) 
      ? date 
      : new Date();
    
    console.log("Submitting journal entry with date:", {
      dateObject: validDate,
      dateToString: validDate.toString(),
      dateISOString: validDate.toISOString(),
      dateType: typeof validDate
    });
    
    const journalData: Omit<InsertSightingJournal, "userId"> = {
      penguinId: penguin.id,
      sightingDate: validDate,
      location,
      notes: notes || null,
      coordinates: coordinates || null,
    };
    
    if (isEditing && entry) {
      updateJournalEntry(entry.id, journalData)
        .then(() => {
          toast({
            title: "Journal updated",
            description: `Your sighting of the ${penguin.name} has been updated.`,
          });
          onComplete();
        })
        .catch((error: Error) => {
          console.error("Error updating journal entry:", error);
          toast({
            title: "Update failed",
            description: error.message || "There was an error updating your journal entry. Please try again.",
            variant: "destructive",
          });
        });
    } else {
      addJournalEntry(journalData)
        .then(() => {
          toast({
            title: "Journal entry added",
            description: `Your sighting of the ${penguin.name} has been recorded.`,
          });
          onComplete();
        })
        .catch((error: Error) => {
          console.error("Error adding journal entry:", error);
          toast({
            title: "Submission failed",
            description: error.message || "There was an error saving your journal entry. Please try again.",
            variant: "destructive",
          });
        });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h3 className={`text-lg font-medium ${isDark ? '' : 'text-gray-800'}`}>
          {isEditing ? "Edit Journal Entry" : "Add Journal Entry"}
        </h3>
        <p className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-gray-600'}`}>
          Record when and where you spotted the {penguin.name}.
        </p>
      </div>
      
      {/* Date selector */}
      <div className="space-y-2">
        <label htmlFor="date" className={`text-sm font-medium ${isDark ? '' : 'text-gray-700'}`}>
          Date of Sighting
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground",
                !isDark && "border-gray-300 text-gray-800 hover:bg-gray-100 bg-white"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className={`w-auto p-0 ${!isDark && 'bg-white border-gray-200'}`}>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              initialFocus
              className={!isDark ? 'bg-white text-gray-800' : ''}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Location input */}
      <div className="space-y-2">
        <label htmlFor="location" className={`text-sm font-medium ${isDark ? '' : 'text-gray-700'}`}>
          Location <span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-2">
          <Input
            id="location"
            placeholder="e.g., Boulders Beach, South Africa"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className={`flex-1 ${!isDark && 'border-gray-300 text-gray-800 placeholder:text-gray-500 bg-white'}`}
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleGetLocation}
            title="Use current location"
            className={!isDark ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : ''}
          >
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Notes textarea */}
      <div className="space-y-2">
        <label htmlFor="notes" className={`text-sm font-medium ${isDark ? '' : 'text-gray-700'}`}>
          Notes
        </label>
        <Textarea
          id="notes"
          placeholder="Add any details about your sighting..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className={!isDark ? 'border-gray-300 text-gray-800 placeholder:text-gray-500 bg-white' : ''}
        />
      </div>
      
      {/* Coordinates (hidden but set by geolocation) */}
      <input
        type="hidden"
        id="coordinates"
        value={coordinates}
      />
      
      {/* Show coordinates if they exist */}
      {coordinates && (
        <div className={`text-sm ${isDark ? 'text-muted-foreground' : 'text-gray-600'}`}>
          <span className={`font-medium ${!isDark && 'text-gray-700'}`}>GPS Coordinates:</span> {coordinates}
        </div>
      )}
      
      {/* Form actions */}
      <div className="flex justify-end space-x-2 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className={!isDark ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : ''}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        
        <Button 
          type="submit" 
          disabled={!isValid || isAddingJournalEntry || isUpdatingJournalEntry}
          className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
        >
          <Save className="mr-2 h-4 w-4" />
          {isEditing ? "Update" : "Save"}
        </Button>
      </div>
    </form>
  );
}