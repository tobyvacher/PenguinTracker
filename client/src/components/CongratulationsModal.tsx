import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, Share2, Twitter, Mail, Check, Copy } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";
import { useState } from "react";

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  count?: number; // Optional count to determine which achievement to show
}

export default function CongratulationsModal({ isOpen, onClose, count = 18 }: CongratulationsModalProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Get the appropriate share text based on the count
  const getShareText = () => {
    if (count >= 18) return "I've spotted all 18 penguin species in the Penguin Tracker app! 🐧";
    if (count >= 15) return `I've spotted 15 penguin species in the Penguin Tracker app! 🐧`;
    if (count >= 10) return `I've spotted 10 penguin species in the Penguin Tracker app! 🐧`;
    return `I've spotted 5 penguin species in the Penguin Tracker app! 🐧`;
  };
  
  const shareText = getShareText();
  
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
        shareUrl = `mailto:?subject=${encodeURIComponent('My Penguin Tracking Achievement')}&body=${encodeURIComponent(shareText + '\n\n' + window.location.href)}`;
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-[#1E3A8A]">
              Congratulations!
            </DialogTitle>
            <DialogDescription className="text-slate-600">
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
            
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {count >= 18 ? "Master Penguin Tracker" :
               count >= 15 ? "Advanced Penguin Tracker" :
               count >= 10 ? "Intermediate Penguin Tracker" :
               "Novice Penguin Tracker"}
            </h3>
            <p className="text-center text-slate-600 mb-6">
              {count >= 18 ? "You're now a penguin expert! Share your knowledge and continue your journey exploring the fascinating world of penguins." :
               count >= 15 ? "You're making amazing progress! Continue exploring and spotting the remaining penguin species." :
               count >= 10 ? "You're getting better at penguin spotting! Keep going to discover more fascinating species." :
               "Great start on your penguin spotting journey! Keep exploring to find more amazing penguin species."}
            </p>
            
            <div className="flex gap-4 mb-6">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 flex items-center gap-2"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                Share Achievement
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share your achievement</DialogTitle>
            <DialogDescription>
              Let others know about your penguin spotting achievement!
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm">{shareText}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button onClick={useNativeShare} className="flex items-center gap-2">
                  <Share2 size={18} />
                  Share
                </Button>
              )}
              
              <Button onClick={() => handleSocialShare('twitter')} variant="outline" className="flex items-center gap-2">
                <Twitter size={18} className="text-[#1DA1F2]" />
                Twitter
              </Button>
              
              <Button onClick={() => handleSocialShare('whatsapp')} variant="outline" className="flex items-center gap-2">
                <FaWhatsapp size={18} className="text-[#25D366]" />
                WhatsApp
              </Button>
              
              <Button onClick={() => handleSocialShare('email')} variant="outline" className="flex items-center gap-2">
                <Mail size={18} className="text-gray-600" />
                Email
              </Button>
              
              <Button onClick={copyToClipboard} variant="outline" className="flex items-center gap-2">
                {isCopied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                {isCopied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}