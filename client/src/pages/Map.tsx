import React from 'react';
import PenguinMap from '@/components/PenguinMap';
import ProgressCounter from '@/components/ProgressCounter';
import ThemeToggle from '@/components/ThemeToggle';
import { usePenguinStore } from '@/hooks/use-penguin-store';
import { useQuery } from '@tanstack/react-query';
import { Penguin } from '@shared/schema';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function Map() {
  const { isAuthenticated } = useAuth();
  const { seenPenguins } = usePenguinStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Force window to scroll to top when the component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: penguins = [] } = useQuery<Penguin[]>({
    queryKey: ['/api/penguins'],
    staleTime: 60 * 1000, // 1 minute
  });

  return (
    <div className={`${isDark ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-[#F8FAFC] to-[#E2E8F0]'} min-h-screen font-sans text-foreground`}>
      {/* Header */}
      <header className={`sticky top-0 ${isDark ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm shadow-md z-[100]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-row justify-between items-center">
            <div className="flex items-center">
              <Link to="/">
                <div className={`flex items-center mr-8 hover:opacity-80 transition-opacity ${isDark ? 'text-gray-200' : ''}`}>
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  <span>Back to Species</span>
                </div>
              </Link>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1E3A8A]'}`}>Penguin Habitats</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle variant="toggle" className="mr-2" />
              <ProgressCounter count={seenPenguins.length} total={penguins.length} />
            </div>
          </div>
        </div>
      </header>
      
      <main className="container px-4 py-8 mx-auto">
        <p className={`text-center mb-8 max-w-2xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Explore the global distribution of all 18 penguin species. Colored circles represent penguin 
          habitats, with brighter colors indicating species you've already spotted.
        </p>
        
        <PenguinMap 
          penguins={penguins} 
          seenPenguins={seenPenguins} 
        />
      </main>
    </div>
  );
}