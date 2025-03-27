import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Twitter, Mail, Check, Copy, Image } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import ShareAchievement from "./ShareAchievement";
import { useTheme } from "@/contexts/ThemeContext";

interface ProgressCounterProps {
  count: number;
  total: number;
}

export default function ProgressCounter({ count, total }: ProgressCounterProps) {
  const [progress, setProgress] = useState(0);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showShareAchievement, setShowShareAchievement] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  useEffect(() => {
    // Avoid division by zero
    const percentage = total > 0 ? (count / total) * 100 : 0;
    setProgress(percentage);
  }, [count, total]);

  // Calculate the circumference of the circle
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const shareText = `I've spotted ${count} out of ${total} penguin species in the wild with Penguin Tracker! 🐧`;
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
          <div className={`absolute inset-0 flex items-center justify-center text-sm font-medium ${isDark ? 'text-white' : ''}`}>
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
        <DialogContent className={`sm:max-w-md ${isDark ? 'bg-gray-800 border-gray-700 text-white' : ''}`}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>Share your progress</DialogTitle>
            <DialogDescription className={isDark ? 'text-gray-300' : ''}>
              Let others know about your penguin spotting adventures!
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className={`p-4 ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50'} rounded-md`}>
              <p className="text-sm">{shareText}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button onClick={useNativeShare} className="flex items-center gap-2">
                  <Share2 size={18} />
                  Share
                </Button>
              )}
              
              <Button onClick={() => handleSocialShare('twitter')} variant="outline" className={`flex items-center gap-2 ${isDark ? 'border-gray-700 hover:bg-gray-700' : ''}`}>
                <Twitter size={18} className="text-[#1DA1F2]" />
                <span className={isDark ? 'text-gray-200' : ''}>Twitter</span>
              </Button>
              
              <Button onClick={() => handleSocialShare('whatsapp')} variant="outline" className={`flex items-center gap-2 ${isDark ? 'border-gray-700 hover:bg-gray-700' : ''}`}>
                <FaWhatsapp size={18} className="text-[#25D366]" />
                <span className={isDark ? 'text-gray-200' : ''}>WhatsApp</span>
              </Button>
              
              <Button onClick={() => handleSocialShare('email')} variant="outline" className={`flex items-center gap-2 ${isDark ? 'border-gray-700 hover:bg-gray-700' : ''}`}>
                <Mail size={18} className={isDark ? 'text-gray-300' : 'text-gray-600'} />
                <span className={isDark ? 'text-gray-200' : ''}>Email</span>
              </Button>
              
              <Button onClick={copyToClipboard} variant="outline" className={`flex items-center gap-2 ${isDark ? 'border-gray-700 hover:bg-gray-700' : ''}`}>
                {isCopied ? <Check size={18} className="text-green-600" /> : <Copy size={18} className={isDark ? 'text-gray-300' : ''} />}
                <span className={isDark ? 'text-gray-200' : ''}>{isCopied ? "Copied!" : "Copy"}</span>
              </Button>
            </div>
            
            <div className="flex justify-center">
              <Button 
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
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
      
      {/* ShareAchievement Modal */}
      <ShareAchievement
        title="My Penguin Spotting Progress"
        message={`I've spotted ${count} out of ${total} penguin species!`}
        count={count}
        total={total}
        isOpen={showShareAchievement}
        onClose={() => setShowShareAchievement(false)}
      />
    </>
  );
}
