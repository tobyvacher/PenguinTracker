import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface CongratulationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CongratulationsModal({ isOpen, onClose }: CongratulationsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-[#1E3A8A]">
            Congratulations!
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            You've spotted all 18 penguin species in the world!
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
              className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-full shadow-lg border-4 border-purple-300"
            >
              <Trophy className="h-16 w-16 text-yellow-300" />
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
          
          <h3 className="text-xl font-bold text-slate-800 mb-2">Master Penguin Spotter</h3>
          <p className="text-center text-slate-600 mb-6">
            You're now a penguin expert! Share your knowledge and continue your journey exploring the fascinating world of penguins.
          </p>
          
          <Button 
            className="bg-[#1E3A8A] hover:bg-[#3B82F6] text-white rounded-full px-6"
            onClick={onClose}
          >
            Continue Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}