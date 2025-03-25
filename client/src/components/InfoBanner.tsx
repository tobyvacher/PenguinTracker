import { Info, X } from "lucide-react";
// No useState or useEffect needed

interface InfoBannerProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function InfoBanner({ isVisible, onClose }: InfoBannerProps) {
  if (!isVisible) return null;
  
  return (
    <div className="bg-[#1E3A8A]/10 rounded-full p-4 mb-8 text-[#334155]">
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1">
          <div className="flex-shrink-0 bg-white rounded-full p-2 shadow">
            <Info className="text-[#1E3A8A] h-5 w-5" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium">How to use Penguin Spotter</h3>
            <div className="mt-1 text-sm">
              <p>Click on a penguin to mark it as seen. Long press (or right-click) to learn more about each species.</p>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="rounded-full p-2 hover:bg-white/50 transition-colors"
          aria-label="Close information banner"
        >
          <X className="h-5 w-5 text-[#1E3A8A]" />
        </button>
      </div>
    </div>
  );
}
