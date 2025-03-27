import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, Share2, Image } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import ShareAchievement from "./ShareAchievement";
import SocialShareButtons from "./SocialShareButtons";

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  count?: number; // Optional count to determine which achievement to show
}

export default function CongratulationsModal({ isOpen, onClose, count = 18 }: CongratulationsModalProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [showShareAchievement, setShowShareAchievement] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Get the appropriate share text based on the count
  const getShareText = () => {
    if (count >= 18) return "I've spotted all 18 penguin species in the Penguin Tracker app! 🐧";
    if (count >= 15) return `I've spotted 15 penguin species in the Penguin Tracker app! 🐧`;
    if (count >= 10) return `I've spotted 10 penguin species in the Penguin Tracker app! 🐧`;
    return `I've spotted 5 penguin species in the Penguin Tracker app! 🐧`;
  };
  
  const getAchievementTitle = () => {
    if (count >= 18) return "Master Penguin Tracker";
    if (count >= 15) return "Advanced Penguin Tracker";
    if (count >= 10) return "Intermediate Penguin Tracker";
    return "Novice Penguin Tracker";
  };
  
  const shareText = getShareText();
  
  const handleShare = () => {
    setIsShareDialogOpen(true);
  };
  
  // Use Web Share API if available
  const useNativeShare = () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      navigator.share({
        title: 'Penguin Tracker Achievement',
        text: shareText,
        url: window.location.href
      })
      .catch((error) => console.log('Error sharing:', error));
      setIsShareDialogOpen(false);
    }
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`sm:max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <DialogHeader className="text-center">
            <DialogTitle className={`text-2xl font-bold ${isDark ? 'text-blue-300' : 'text-[#1E3A8A]'}`}>
              Congratulations!
            </DialogTitle>
            <DialogDescription className={`${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              {count >= 18 ? "You've spotted all 18 penguin species in the world!" :
               count >= 15 ? "You've spotted 15 penguin species in the wild!" :
               count >= 10 ? "You've spotted 10 penguin species in the wild!" :
               "You've spotted 5 penguin species in the wild!"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-6">
            <div className="relative mb-4">
              <motion.div
                animate={{ 
                  rotate: [0, 5, 0, -5, 0],
                  scale: [1, 1.05, 1, 1.05, 1]
                }}
                transition={{ 
                  duration: 2, 
                  ease: "easeInOut", 
                  repeat: Infinity,
                  repeatType: "loop"
                }}
                className={`p-6 rounded-full shadow-lg border-4 ${
                  count >= 18 ? "bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300" :
                  count >= 15 ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-300" :
                  count >= 10 ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-300" :
                  "bg-gradient-to-r from-green-600 to-teal-600 border-green-300"
                }`}
              >
                <Trophy className={`h-16 w-16 ${count >= 18 ? "text-amber-400" : "text-white"}`} />
              </motion.div>
              
              {/* Sparkles */}
              <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="h-6 w-6 text-yellow-400" />
              </motion.div>
              
              <motion.div
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                className="absolute -bottom-2 -left-2"
              >
                <Sparkles className="h-6 w-6 text-yellow-400" />
              </motion.div>
            </div>
            
            <h3 className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-slate-800'} mb-2`}>
              {count >= 18 ? "Master Penguin Tracker" :
               count >= 15 ? "Advanced Penguin Tracker" :
               count >= 10 ? "Intermediate Penguin Tracker" :
               "Novice Penguin Tracker"}
            </h3>
            <p className={`text-center ${isDark ? 'text-gray-300' : 'text-slate-600'} mb-6`}>
              {count >= 18 ? "You're now a penguin expert! Share your knowledge and continue your journey exploring the fascinating world of penguins." :
               count >= 15 ? "You're making amazing progress! Continue exploring and spotting the remaining penguin species." :
               count >= 10 ? "You're getting better at penguin spotting! Keep going to discover more fascinating species." :
               "Great start on your penguin spotting journey! Keep exploring to find more amazing penguin species."}
            </p>
            
            <div className="flex gap-3 mb-6">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5 flex items-center gap-2"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                Simple Share
              </Button>
              
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-5 flex items-center gap-2"
                onClick={() => {
                  onClose(); // Close the congratulations modal first
                  setShowShareAchievement(true);
                }}
              >
                <Image className="h-4 w-4" />
                Create Image
              </Button>
            </div>
            
            <Button 
              className="bg-[#1E3A8A] hover:bg-[#3B82F6] text-white rounded-full px-6"
              onClick={onClose}
            >
              Continue Exploring
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className={`sm:max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>Share your achievement</DialogTitle>
            <DialogDescription className={isDark ? 'text-gray-300' : ''}>
              Let others know about your penguin spotting achievement!
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className={`p-4 ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50'} rounded-md`}>
              <p className="text-sm">{shareText}</p>
            </div>
            
            <div className="mb-3">
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button onClick={useNativeShare} className="flex items-center gap-2 mx-auto">
                  <Share2 size={18} />
                  Native Share
                </Button>
              )}
            </div>
            
            <SocialShareButtons 
              shareText={shareText} 
              buttonStyle="grid"
              className="mb-2"
            />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* ShareAchievement Modal */}
      <ShareAchievement
        title={`${getAchievementTitle()} Achievement!`}
        message={shareText.replace(' 🐧', '')}
        count={count}
        total={18}
        isOpen={showShareAchievement}
        onClose={() => setShowShareAchievement(false)}
      />
    </>
  );
}