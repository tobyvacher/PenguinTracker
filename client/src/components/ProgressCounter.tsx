import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface ProgressCounterProps {
  count: number;
  total: number;
}

export default function ProgressCounter({ count, total }: ProgressCounterProps) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Avoid division by zero
    const percentage = total > 0 ? (count / total) * 100 : 0;
    setProgress(percentage);
  }, [count, total]);

  // Calculate the circumference of the circle
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex items-center bg-white rounded-full px-4 py-2 shadow">
      <div className="relative h-10 w-10 mr-3">
        <svg className="h-10 w-10" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="#E2E8F0" strokeWidth="2"></circle>
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
        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium">
          {count}/{total}
        </div>
      </div>
      <div>
        <p className="text-[#334155] font-medium">{count}/{total} penguins</p>
        <p className="text-xs text-[#94A3B8]">seen in the wild</p>
      </div>
    </div>
  );
}
