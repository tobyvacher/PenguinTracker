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
      className="rounded-lg bg-white shadow overflow-hidden cursor-pointer"
      whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.2 }}
      onMouseDown={pressStartHandler}
      onMouseUp={pressEndHandler}
      onMouseLeave={pressEndHandler}
      onTouchStart={pressStartHandler}
      onTouchEnd={pressEndHandler}
      onContextMenu={handleContextMenu}
    >
      <div className="relative">
        <img 
          src={penguin.imageUrl}
          alt={penguin.name}
          className={`w-full aspect-square object-cover transition-all duration-300 ${
            !isSeen ? 'grayscale' : ''
          }`}
        />
        <motion.div 
          className="absolute top-2 right-2 bg-[#10B981] text-white rounded-full p-1"
          initial={{ opacity: 0, scale: 0 }}
          animate={isSeen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Eye className="h-4 w-4" />
        </motion.div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-center">{penguin.name}</h3>
      </div>
    </motion.div>
  );
}
