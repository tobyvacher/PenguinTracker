import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Mail, Check, Copy, Image } from "lucide-react";
import { FaWhatsapp, FaXTwitter } from "react-icons/fa6";
import ShareAchievement from "./ShareAchievement";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { Penguin } from "@shared/schema";

interface ProgressCounterProps {
  count: number;
  total: number;
  seenPenguinIds?: number[];
}

export default function ProgressCounter({ count, total, seenPenguinIds = [] }: ProgressCounterProps) {
  const [progress, setProgress] = useState(0);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showShareAchievement, setShowShareAchievement] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // Fetch all penguins for sharing in the achievement modal
  const { data: penguins } = useQuery<Penguin[]>({
    queryKey: ["/api/penguins"],
  });
  
  useEffect(() => {
    // Avoid division by zero
    const percentage = total > 0 ? (count / total) * 100 : 0;
    setProgress(percentage);
  }, [count, total]);

  // Calculate the circumference of the circle
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const shareText = `I've spotted ${count} penguin species in Penguin Tracker! 🐧`;
  const shareUrl = window.location.href;

  const handleShare = () => {
    setIsShareDialogOpen(true);
  };

  const handleSocialShare = (platform: string) => {
    let shareUrl = '';
    
    switch(platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + window.location.href)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('My Penguin Spotting Progress')}&body=${encodeURIComponent(shareText + '\n\n' + window.location.href)}`;
        break;
      default:
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText + ' ' + window.location.href)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
  };

  // Use Web Share API if available
  const useNativeShare = () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      navigator.share({
        title: 'My Penguin Spotting Progress',
        text: shareText,
        url: window.location.href
      })
      .catch((error) => console.log('Error sharing:', error));
      setIsShareDialogOpen(false);
    }
  };

  // Get seen penguins details for sharing in the achievement card
  const getSeenPenguinDetails = () => {
    if (!penguins || !Array.isArray(penguins)) return [];
    
    // Create a set of seen penguin IDs for faster lookup
    const seenPenguinIdSet = new Set(seenPenguinIds);
    
    // Only return penguins that have been marked as seen
    if (seenPenguinIds.length > 0) {
      return penguins.filter(penguin => seenPenguinIdSet.has(penguin.id));
    }
    
    // If no penguins have been marked as seen, return an empty array
    return [];
  };

  return (
    <>
      <div 
        className={`flex items-center ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-full px-4 py-2 shadow cursor-pointer transition-colors`}
        onClick={handleShare}
      >
        <div className="relative h-10 w-10 mr-3">
          <svg className="h-10 w-10" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="16" fill="none" stroke={isDark ? "#4B5563" : "#E2E8F0"} strokeWidth="2"></circle>
            <motion.circle 
              cx="18" 
              cy="18" 
              r="16" 
              fill="none" 
              stroke="#10B981" 
              strokeWidth="3" 
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              transform="rotate(-90 18 18)"
            />
          </svg>
          <div className={`absolute inset-0 flex items-center justify-center text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {count}
          </div>
        </div>
        <div className="flex-1">
          <p className={`${isDark ? 'text-white' : 'text-[#334155]'} font-medium`}>{count}/{total} penguins</p>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-[#94A3B8]'}`}>seen in the wild</p>
        </div>
        <Share2 size={18} className={`${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`} />
      </div>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className={`sm:max-w-md ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white text-gray-800'}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : 'text-gray-800'}>Share your progress</DialogTitle>
            <DialogDescription className={isDark ? 'text-gray-300' : 'text-gray-600'}>
              Let others know about your penguin spotting adventures!
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className={`p-4 ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'} rounded-md`}>
              <p className="text-sm">{shareText}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button onClick={useNativeShare} className={`flex items-center gap-2 ${isDark ? 'bg-primary' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  <Share2 size={18} />
                  Share
                </Button>
              )}
              
              <Button 
                onClick={() => handleSocialShare('twitter')} 
                className="flex items-center gap-2 text-white bg-black hover:bg-gray-900"
              >
                <FaXTwitter className="h-[18px] w-[18px]" />
                <span>X</span>
              </Button>
              
              <Button 
                onClick={() => handleSocialShare('whatsapp')} 
                className={`flex items-center gap-2 text-white ${isDark ? 'bg-gradient-to-r from-[#25D366] to-[#128C7E]' : 'bg-[#25D366] hover:bg-[#20BD5C]'}`}
              >
                <FaWhatsapp size={18} />
                <span>WhatsApp</span>
              </Button>
              
              <Button 
                onClick={() => handleSocialShare('email')} 
                className={`flex items-center gap-2 text-white ${isDark ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-red-500 hover:bg-red-600'}`}
              >
                <Mail size={18} />
                <span>Email</span>
              </Button>
              
              <Button 
                onClick={copyToClipboard} 
                className={`flex items-center gap-2 text-white ${isDark ? 'bg-gradient-to-r from-gray-600 to-gray-800' : 'bg-gray-500 hover:bg-gray-600'}`}
              >
                {isCopied ? <Check size={18} /> : <Copy size={18} />}
                <span>{isCopied ? "Copied!" : "Copy"}</span>
              </Button>
            </div>
            
            <div className="flex justify-center">
              <Button 
                className={`flex items-center gap-2 ${isDark ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                onClick={() => {
                  setIsShareDialogOpen(false); // Close the share dialog
                  setShowShareAchievement(true);
                }}
              >
                <Image size={18} />
                Create Shareable Image
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* ShareAchievement Modal, now with seenPenguins for showing the photos */}
      <ShareAchievement
        title="My Penguin Spotting Progress"
        message={`I've spotted ${count} penguin species in Penguin Tracker!`}
        count={count}
        total={total}
        seenPenguins={getSeenPenguinDetails()}
        isOpen={showShareAchievement}
        onClose={() => setShowShareAchievement(false)}
      />
    </>
  );
}
