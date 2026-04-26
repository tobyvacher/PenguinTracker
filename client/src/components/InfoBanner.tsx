import { Info, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface InfoBannerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function InfoBanner({ isVisible, onClose }: InfoBannerProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  if (!isVisible) return null;
  
  return (
    <div className={`${isDark ? 'bg-blue-900/20 text-gray-200' : 'bg-[#1E3A8A]/10 text-[#334155]'} rounded-full p-4 mb-8`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <div className={`flex-shrink-0 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-full p-2 shadow`}>
            <Info className={`${isDark ? 'text-blue-400' : 'text-[#1E3A8A]'} h-5 w-5`} />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium">How to use Penguin Tracker</h3>
            <div className="mt-1 text-sm">
              <p>Click on a penguin to mark it as seen. Tap the <strong>ⓘ</strong> icon on any penguin to learn more about that species and log your sightings. Sign in to save your progress for next time. Welcome to Penguin Tracker!</p>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className={`rounded-full p-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white/50'} transition-colors`}
          aria-label="Close information banner"
        >
          <X className={`h-5 w-5 ${isDark ? 'text-gray-300' : 'text-[#1E3A8A]'}`} />
        </button>
      </div>
    </div>
  );
}
