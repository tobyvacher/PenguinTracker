import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Map, Save, X } from "lucide-react";
import { Penguin, SightingJournal } from "@shared/schema";
import { GuestJournalEntry } from "@/hooks/use-guest-journal";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

type AnyEntry = SightingJournal | GuestJournalEntry;

type AddData = {
  penguinId: number;
  sightingDate: Date;
  location: string;
  notes: string | null;
  coordinates: string | null;
};

type UpdateData = Partial<Omit<AddData, "penguinId">>;

interface JournalEntryFormProps {
  penguin: Penguin;
  entry?: AnyEntry;
  onComplete: () => void;
  onCancel: () => void;
  onAdd: (data: AddData) => Promise<void>;
  onUpdate: (id: number, data: UpdateData) => Promise<void>;
  isSaving?: boolean;
}

export default function JournalEntryForm({
  penguin,
  entry,
  onComplete,
  onCancel,
  onAdd,
  onUpdate,
  isSaving = false,
}: JournalEntryFormProps) {
  const { toast } = useToast();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isEditing = !!entry;

  const [date, setDate] = useState<Date>(
    entry?.sightingDate ? new Date(entry.sightingDate as string) : new Date()
  );
  const [location, setLocation] = useState(entry?.location ?? '');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [coordinates, setCoordinates] = useState(entry?.coordinates ?? '');

  const isValid = location.trim().length > 0;

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Geolocation is not supported by your browser. Please enter location manually.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates(`${coords.latitude},${coords.longitude}`);
        toast({ title: "Location detected", description: "Your current location has been added." });
      },
      () => {
        toast({
          title: "Location error",
          description: "Unable to get your current location. Please enter it manually.",
          variant: "destructive",
        });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      toast({
        title: "Location required",
        description: "Please provide a location for your sighting.",
        variant: "destructive",
      });
      return;
    }

    const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date();

    try {
      if (isEditing && entry) {
        await onUpdate(entry.id, {
          sightingDate: validDate,
          location,
          notes: notes || null,
          coordinates: coordinates || null,
        });
      } else {
        await onAdd({
          penguinId: penguin.id,
          sightingDate: validDate,
          location,
          notes: notes || null,
          coordinates: coordinates || null,
        });
      }
      onComplete();
    } catch {
      // Error toast is handled inside the caller
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
        <label htmlFor="sighting-date" className={`text-sm font-medium ${isDark ? '' : 'text-gray-700'}`}>
          Date of Sighting
        </label>
        <input
          id="sighting-date"
          type="date"
          max={(() => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; })()}
          value={`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
          onChange={(e) => {
            const [y, m, d] = e.target.value.split('-').map(Number);
            const parsed = new Date(y, m - 1, d);
            if (!isNaN(parsed.getTime())) setDate(parsed);
          }}
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
            isDark
              ? 'bg-background border-input text-foreground'
              : 'bg-white border-gray-300 text-gray-800'
          }`}
        />
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
            className={!isDark ? 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white' : ''}
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
          value={notes ?? ''}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className={!isDark ? 'border-gray-300 text-gray-800 placeholder:text-gray-500 bg-white' : ''}
        />
      </div>

      {/* Coordinates display */}
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
          disabled={isSaving}
          className={!isDark ? 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white' : ''}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!isValid || isSaving}
          className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : isEditing ? "Update" : "Save"}
        </Button>
      </div>
    </form>
  );
}
