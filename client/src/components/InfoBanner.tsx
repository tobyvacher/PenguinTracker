import { Info } from "lucide-react";

export default function InfoBanner() {
  return (
    <div className="bg-[#1E3A8A]/10 rounded-lg p-4 mb-8 text-[#334155]">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <Info className="text-[#1E3A8A] h-5 w-5" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">How to use Penguin Spotter</h3>
          <div className="mt-2 text-sm">
            <p>Click on a penguin to mark it as seen. Long press (or right-click) to learn more about each species.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
