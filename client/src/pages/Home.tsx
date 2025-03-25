import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import PenguinCard from "@/components/PenguinCard";
import PenguinModal from "@/components/PenguinModal";
import ProgressCounter from "@/components/ProgressCounter";
import InfoBanner from "@/components/InfoBanner";
import SuccessToast from "@/components/SuccessToast";
import { usePenguinStore } from "@/hooks/use-penguin-store";
import { Penguin } from "@shared/schema";
import { Feather, HelpCircle } from "lucide-react";

export default function Home() {
  const [selectedPenguin, setSelectedPenguin] = useState<Penguin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  
  const { seenPenguins, toggleSeen } = usePenguinStore();

  // Fetch all penguins
  const { data, isLoading, error } = useQuery<Penguin[]>({
    queryKey: ["/api/penguins"],
  });
  
  // Ensure penguins is always an array
  const penguins: Penguin[] = data || [];

  const handlePenguinClick = (penguin: Penguin) => {
    const wasSeen = seenPenguins.includes(penguin.id);
    toggleSeen(penguin.id);
    
    if (!wasSeen) {
      setToastMessage(`You've spotted the ${penguin.name}!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handlePenguinLongPress = (penguin: Penguin) => {
    setSelectedPenguin(penguin);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h2 className="text-xl font-semibold">Loading penguins...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">
          <h2 className="text-xl font-semibold">Error loading penguins</h2>
          <p>Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0] min-h-screen font-sans text-[#334155]">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-sm shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Feather className="text-[#1E3A8A] mr-3 h-6 w-6" />
              <h1 className="text-2xl font-bold text-[#1E3A8A]">Penguin Spotter</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowInfoBanner(true)}
                className="bg-white rounded-full p-2 shadow-sm hover:bg-slate-100 transition-colors"
                aria-label="Show help information"
              >
                <HelpCircle className="text-[#1E3A8A] h-5 w-5" />
              </button>
              <ProgressCounter count={seenPenguins.length} total={penguins.length} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InfoBanner 
          isVisible={showInfoBanner}
          onClose={() => setShowInfoBanner(false)}
        />
        
        {/* Penguin Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 py-4">
          {penguins.map((penguin: Penguin) => (
            <PenguinCard
              key={penguin.id}
              penguin={penguin}
              isSeen={seenPenguins.includes(penguin.id)}
              onClick={() => handlePenguinClick(penguin)}
              onLongPress={() => handlePenguinLongPress(penguin)}
            />
          ))}
        </div>
      </main>

      {/* Modals and Toasts */}
      {selectedPenguin && (
        <PenguinModal 
          penguin={selectedPenguin} 
          isOpen={isModalOpen} 
          onClose={closeModal} 
        />
      )}
      
      <SuccessToast 
        message={toastMessage} 
        isVisible={showToast} 
      />
    </div>
  );
}
