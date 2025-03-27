import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  SortAsc, 
  SortDesc, 
  ListOrdered, 
  Group, 
  ArrowDownUp,
  MapPin
} from "lucide-react";
import { PenguinSortType } from "@/lib/penguin-sorting";

interface SortingControlsProps {
  onSortChange: (sortType: PenguinSortType) => void;
  currentSort: PenguinSortType;
}

export default function SortingControls({ 
  onSortChange, 
  currentSort 
}: SortingControlsProps) {
  // Track if mounted to avoid hydration issues
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-10 bg-gray-100 animate-pulse rounded-md w-40"></div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Sort by:</span>
      <Select 
        value={currentSort} 
        onValueChange={(value) => onSortChange(value as PenguinSortType)}
      >
        <SelectTrigger className={`w-[180px] ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <SelectValue placeholder="Sort penguins..." className={isDark ? 'text-gray-200' : 'text-gray-800'} />
        </SelectTrigger>
        <SelectContent className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
          <SelectItem value="default" className={isDark ? 'text-gray-200' : ''}>
            <div className="flex items-center gap-2">
              <ArrowDownUp className="h-4 w-4" />
              <span>Default</span>
            </div>
          </SelectItem>
          <SelectItem value="alphabetical" className={isDark ? 'text-gray-200' : ''}>
            <div className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4" />
              <span>Alphabetical</span>
            </div>
          </SelectItem>
          <SelectItem value="size-asc" className={isDark ? 'text-gray-200' : ''}>
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4" />
              <span>Size (Smallest first)</span>
            </div>
          </SelectItem>
          <SelectItem value="size-desc" className={isDark ? 'text-gray-200' : ''}>
            <div className="flex items-center gap-2">
              <SortDesc className="h-4 w-4" />
              <span>Size (Largest first)</span>
            </div>
          </SelectItem>
          <SelectItem value="genus" className={isDark ? 'text-gray-200' : ''}>
            <div className="flex items-center gap-2">
              <Group className="h-4 w-4" />
              <span>By Genus</span>
            </div>
          </SelectItem>
          <SelectItem value="region" className={isDark ? 'text-gray-200' : ''}>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>By Region</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}