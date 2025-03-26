import { Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface AchievementBadgeProps {
  count: number;
  onClick?: () => void;
}

export default function AchievementBadge({ count, onClick }: AchievementBadgeProps) {
  const getBadgeColor = () => {
    if (count >= 18) return "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-300";
    if (count >= 15) return "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-300";
    if (count >= 10) return "bg-gradient-to-r from-green-600 to-teal-600 border-green-300";
    return "bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300";
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -15 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20
      }}
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-white text-sm font-semibold shadow-lg border-2 ${getBadgeColor()} ${onClick ? 'cursor-pointer hover:brightness-110 active:scale-95 transition-all' : ''}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label={onClick && count === 18 ? "Show congratulations for finding all penguins" : undefined}
    >
      <Trophy className={`w-4 h-4 ${count >= 18 ? 'text-amber-400' : ''}`} />
      <span>{count}</span>
    </motion.div>
  );
}