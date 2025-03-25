import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { Penguin } from "@shared/schema";

interface PenguinCardProps {
  penguin: Penguin;
  isSeen: boolean;
  onClick: () => void;
  onLongPress: () => void;
}

export default function PenguinCard({ 
  penguin, 
  isSeen, 
  onClick, 
  onLongPress 
}: PenguinCardProps) {
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation variants for the card
  const cardVariants = {
    seen: {
      y: [0, -3, 0],
      rotate: [0, 1, 0, -1, 0],
      transition: {
        y: {
          repeat: 2, // 3 repetitions (initial + 2 repeats)
          duration: 3,
          ease: "easeInOut",
          repeatType: "loop"
        },
        rotate: {
          repeat: 2, // 3 repetitions (initial + 2 repeats)
          duration: 4,
          ease: "easeInOut",
          repeatType: "loop"
        }
      }
    },
    unseen: {
      y: 0,
      rotate: 0
    }
  };
  
  const pressStartHandler = () => {
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      onLongPress();
      setIsPressing(false);
    }, 500);
  };
  
  const pressEndHandler = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent the click from triggering if this was a long press
    if (timerRef.current && !isPressing) {
      e.preventDefault();
    } else if (isPressing) {
      onClick();
    }
    
    setIsPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onLongPress();
  };

  return (
    <motion.div
      className="flex flex-col items-center cursor-pointer"
      variants={cardVariants}
      animate={isSeen ? "seen" : "unseen"}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onMouseDown={pressStartHandler}
      onMouseUp={pressEndHandler}
      onMouseLeave={pressEndHandler}
      onTouchStart={pressStartHandler}
      onTouchEnd={pressEndHandler}
      onContextMenu={handleContextMenu}
    >
      <div className="relative mb-3">
        <div className={`rounded-full overflow-hidden h-32 w-32 transition-all duration-300 ${
          isSeen 
            ? 'border-[#FFD700] border-4 shadow-[0_0_15px_rgba(255,215,0,0.6)]' 
            : 'border-white border-4 shadow-lg'
        }`}>
          <img 
            src={penguin.imageUrl}
            alt={penguin.name}
            className={`w-full h-full object-cover transition-all duration-300 ${
              !isSeen ? 'grayscale' : ''
            }`}
          />
        </div>
        <motion.div 
          className="absolute bottom-0 right-0 bg-[#FFD700] text-[#7B5800] rounded-full p-1.5 shadow-[0_0_8px_rgba(255,215,0,0.8)] border-2 border-white"
          initial={{ opacity: 0, scale: 0 }}
          animate={isSeen ? { 
            opacity: 1, 
            scale: 1,
            rotate: [0, 10, 0, -10, 0],
            transition: {
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 },
              rotate: { 
                repeat: 2, // 3 repetitions (initial + 2 repeats)
                duration: 2,
                ease: "easeInOut",
                delay: 0.3,
                repeatType: "loop"
              }
            }
          } : { 
            opacity: 0, 
            scale: 0 
          }}
        >
          <Eye className="h-4 w-4" />
        </motion.div>
      </div>
      <div className="text-center">
        <h3 className="font-medium">{penguin.name}</h3>
      </div>
    </motion.div>
  );
}
