import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import PenguinCard from "@/components/PenguinCard";
import PenguinModal from "@/components/PenguinModal";
import ProgressCounter from "@/components/ProgressCounter";
import InfoBanner from "@/components/InfoBanner";
import SuccessToast from "@/components/SuccessToast";
import AuthButton from "@/components/AuthButton";
import AchievementBadge from "@/components/AchievementBadge";
import CongratulationsModal from "@/components/CongratulationsModal";
import SortingControls from "@/components/SortingControls";
import GenusGroupView from "@/components/GenusGroupView";
import RegionGroupView from "@/components/RegionGroupView";
import ThemeToggle from "@/components/ThemeToggle";
import { usePenguinStore } from "@/hooks/use-penguin-store";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Penguin } from "@shared/schema";
import { HelpCircle, AlertTriangle, MapPin } from "lucide-react";
import { firebaseConfigValid } from "@/lib/firebase";
import { PenguinSortType, sortPenguins } from "@/lib/penguin-sorting";

export default function Home() {
  // Move all hooks to the top of the component
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { currentUser } = useAuth();
  const { seenPenguins, toggleSeen } = usePenguinStore();
  
  const [selectedPenguin, setSelectedPenguin] = useState<Penguin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [showInfoBanner, setShowInfoBanner] = useState(true);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [congratsCount, setCongratsCount] = useState(18);
  const [sortType, setSortType] = useState<PenguinSortType>("default");
  
  // Track the last milestone reached to prevent showing the badge again for the same milestone
  const lastMilestoneRef = useRef<number>(0);

  // Fetch all penguins
  const { data, isLoading, error } = useQuery<Penguin[]>({
    queryKey: ["/api/penguins"],
  });
  
  // Ensure penguins is always an array
  const penguins: Penguin[] = data || [];
  
  // Check for achievement milestones and trigger effects
  useEffect(() => {
    const count = seenPenguins.length;
    
    if (count === 18 && lastMilestoneRef.current < 18) {
      lastMilestoneRef.current = 18;
      // Show congratulations modal when all 18 are collected
      setCongratsCount(18);
      setShowCongratsModal(true);
    } else if (count >= 15 && lastMilestoneRef.current < 15) {
      lastMilestoneRef.current = 15;
      // We don't automatically show the modal for 15, 10, or 5
    } else if (count >= 10 && lastMilestoneRef.current < 10) {
      lastMilestoneRef.current = 10;
    } else if (count >= 5 && lastMilestoneRef.current < 5) {
      lastMilestoneRef.current = 5;
    }
  }, [seenPenguins.length]);
  
  // This function is no longer used, we use the useEffect above instead
  const checkAchievements = () => {
    // Just a placeholder - logic moved to useEffect
    return false;
  };

  const handlePenguinClick = (penguin: Penguin) => {
    const wasSeen = seenPenguins.includes(penguin.id);
    
    // Set appropriate toast message based on current status
    if (wasSeen) {
      setToastMessage(`Unmarked the ${penguin.name}`);
    } else {
      setToastMessage(`You've spotted the ${penguin.name}!`);
    }
    
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // Toggle penguin status whether seen or not seen
    toggleSeen(penguin.id);
    
    // No need to call anything here - useEffect will automatically
    // check for achievements when seenPenguins.length changes
  };

  const handlePenguinLongPress = (penguin: Penguin) => {
    setSelectedPenguin(penguin);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const closeCongratsModal = () => {
    setShowCongratsModal(false);
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
    <div className={`${isDark ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0]'} min-h-screen font-sans text-foreground`}>
      {/* Header */}
      <header className={`sticky top-0 ${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm shadow-md z-[100]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Responsive header layout */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            {/* Logo and title - centered on mobile, left-aligned on desktop */}
            <div className="flex items-center justify-center sm:justify-start mb-3 sm:mb-0">
              <img src="/logo.png" alt="Penguin Tracker Logo" className="w-10 h-10 mr-3" />
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>Penguin Tracker</h1>
            </div>
            
            {/* Action buttons - centered on mobile, right-aligned on desktop */}
            <div className="flex items-center justify-center sm:justify-end gap-4">
              <ThemeToggle variant="toggle" className="mr-2" />
              
              {!showInfoBanner && (
                <button 
                  onClick={() => setShowInfoBanner(true)}
                  className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-full p-2 shadow-sm ${isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-100'} transition-colors`}
                  aria-label="Show help information"
                >
                  <HelpCircle className={`${isDark ? 'text-white' : 'text-[#1E3A8A]'} h-5 w-5`} />
                </button>
              )}
              {/* Achievement Badge */}
              {seenPenguins.length >= 5 && (
                <AchievementBadge 
                  count={seenPenguins.length >= 18 ? 18 : 
                         seenPenguins.length >= 15 ? 15 : 
                         seenPenguins.length >= 10 ? 10 : 5} 
                  onClick={() => {
                    const count = seenPenguins.length >= 18 ? 18 :
                                  seenPenguins.length >= 15 ? 15 :
                                  seenPenguins.length >= 10 ? 10 : 5;
                    setCongratsCount(count);
                    setShowCongratsModal(true);
                  }}
                />
              )}
              <ProgressCounter count={seenPenguins.length} total={penguins.length} seenPenguinIds={seenPenguins} />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InfoBanner 
          isVisible={showInfoBanner}
          onClose={() => setShowInfoBanner(false)}
        />
        
        {/* Deployment Warning */}
        {!firebaseConfigValid && (
          <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Firebase Configuration Warning</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>
                    Your app is running but Firebase environment variables are missing. For the deployed app to work properly:
                  </p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Make sure all Firebase environment variables are set in your deployment</li>
                    <li>Add your deployment domain ({window.location.hostname}) to the Firebase authorized domains list</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Sorting Controls */}
        <div className="flex justify-end mb-4">
          <SortingControls 
            currentSort={sortType}
            onSortChange={setSortType}
          />
        </div>
        
        {/* Penguin Display - grid, genus grouping, or region grouping */}
        {sortType === "genus" ? (
          <GenusGroupView 
            penguins={penguins}
            seenPenguins={seenPenguins}
            onPenguinClick={handlePenguinClick}
            onPenguinLongPress={handlePenguinLongPress}
          />
        ) : sortType === "region" ? (
          <RegionGroupView
            penguins={penguins}
            seenPenguins={seenPenguins}
            onPenguinClick={handlePenguinClick}
            onPenguinLongPress={handlePenguinLongPress}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 py-4">
            {sortPenguins(penguins, sortType).map((penguin: Penguin) => (
              <div key={penguin.id}>
                <PenguinCard
                  penguin={penguin}
                  isSeen={seenPenguins.includes(penguin.id)}
                  onClick={() => handlePenguinClick(penguin)}
                  onLongPress={() => handlePenguinLongPress(penguin)}
                />
                {sortType !== "default" && (
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'} text-center italic`}>
                    ({penguin.scientificName})
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Bottom Progress Counter */}
        <div className="mt-12 mb-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          {seenPenguins.length >= 5 && (
            <AchievementBadge 
              count={seenPenguins.length >= 18 ? 18 : 
                     seenPenguins.length >= 15 ? 15 : 
                     seenPenguins.length >= 10 ? 10 : 5} 
              onClick={() => {
                const count = seenPenguins.length >= 18 ? 18 :
                              seenPenguins.length >= 15 ? 15 :
                              seenPenguins.length >= 10 ? 10 : 5;
                setCongratsCount(count);
                setShowCongratsModal(true);
              }}
            />
          )}
          <ProgressCounter 
            count={seenPenguins.length} 
            total={penguins.length} 
            seenPenguinIds={seenPenguins}
          />
        </div>
        
        {/* Map Link */}
        <Link to="/map">
          <div className={`${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-slate-50'} rounded-lg shadow-md p-4 mb-8 flex items-center justify-between transition-colors cursor-pointer`}>
            <div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>Explore Penguin Habitats</h2>
              <p className={`${isDark ? 'text-gray-300' : 'text-slate-600'}`}>View the global distribution of all penguin species on an interactive map</p>
            </div>
            <MapPin className={`${isDark ? 'text-blue-300' : 'text-[#1E3A8A]'} h-8 w-8`} />
          </div>
        </Link>
        
        {/* Attribution */}
        <div className="text-center pb-6">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Made by <a href="https://TobyVacher.com" target="_blank" rel="noopener noreferrer" className={`${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} transition-colors font-medium`}>TobyVacher.com</a>
          </p>
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
      
      <CongratulationsModal
        isOpen={showCongratsModal}
        onClose={closeCongratsModal}
        count={congratsCount}
        seenPenguins={penguins.filter((p) => seenPenguins.includes(p.id))}
      />
      
      <SuccessToast 
        message={toastMessage} 
        isVisible={showToast} 
      />
    </div>
  );
}
