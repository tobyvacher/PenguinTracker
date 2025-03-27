import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { Penguin } from "@shared/schema";
import { useTheme } from "@/contexts/ThemeContext";

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
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isScrollingRef = useRef<boolean>(false);
  
  // Animation variants for the card
  const cardVariants = {
    seen: {
      rotate: [0, 4, 0, -4, 0, 2, 0, -2, 0],
      y: [0, -10, 0, -7, 0],
      transition: {
        rotate: {
          repeat: 0, // No repeats, just one animation cycle
          duration: 1.5,
          ease: "easeInOut"
        },
        y: {
          repeat: 0,
          duration: 1.5,
          ease: "easeInOut"
        }
      }
    },
    unseen: {
      rotate: 0,
      y: 0
    }
  };
  
  // Mouse handlers (desktop)
  const mouseDownHandler = () => {
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      onLongPress();
      setIsPressing(false);
    }, 500);
  };
  
  const mouseUpHandler = () => {
    if (isPressing) {
      onClick();
    }
    
    setIsPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Touch handlers (mobile)
  const touchStartHandler = (e: React.TouchEvent) => {
    // Store the starting touch position
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    isScrollingRef.current = false;
    
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      // Only trigger long press if we're not scrolling
      if (!isScrollingRef.current) {
        onLongPress();
      }
      setIsPressing(false);
    }, 500);
  };
  
  const touchMoveHandler = (e: React.TouchEvent) => {
    // If we don't have a starting position, exit
    if (!touchStartPosRef.current) return;
    
    const touch = e.touches[0];
    const currentPos = { x: touch.clientX, y: touch.clientY };
    
    // Calculate distance moved
    const deltaX = Math.abs(currentPos.x - touchStartPosRef.current.x);
    const deltaY = Math.abs(currentPos.y - touchStartPosRef.current.y);
    
    // Lower the threshold to detect scrolling earlier
    if (deltaX > 5 || deltaY > 5) {
      isScrollingRef.current = true;
      
      // Cancel the long press timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsPressing(false);
    }
  };
  
  const touchEndHandler = (e: React.TouchEvent) => {
    // Only handle touches that started on this component
    if (!touchStartPosRef.current) return;
    
    // If the distance moved is very small and we're still pressing, consider it a tap
    if (!isScrollingRef.current && isPressing) {
      // Small delay to ensure the click happens after the touch end event completes
      setTimeout(() => {
        onClick();
      }, 10);
    }
    
    // Reset state
    touchStartPosRef.current = null;
    isScrollingRef.current = false;
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
  
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <motion.div
      className="flex flex-col items-center cursor-pointer"
      variants={cardVariants}
      animate={isSeen ? "seen" : "unseen"}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onMouseDown={mouseDownHandler}
      onMouseUp={mouseUpHandler}
      onMouseLeave={mouseUpHandler}
      onTouchStart={touchStartHandler}
      onTouchMove={touchMoveHandler}
      onTouchEnd={touchEndHandler}
      onContextMenu={handleContextMenu}
    >
      <div className="relative mb-3">
        <div className={`rounded-full overflow-hidden h-32 w-32 transition-all duration-300 ${
          isSeen 
            ? 'border-[#FFD700] border-4 shadow-[0_0_15px_rgba(255,215,0,0.6)]' 
            : `${isDark ? 'border-white' : 'border-gray-200'} border-4 shadow-lg`
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
                repeat: 0, // No repeats, just one animation cycle
                duration: 2,
                ease: "easeInOut",
                delay: 0.3
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
        <h3 className={`font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
          {penguin.name.replace(' Penguin', '')}
        </h3>
      </div>
    </motion.div>
  );
}
