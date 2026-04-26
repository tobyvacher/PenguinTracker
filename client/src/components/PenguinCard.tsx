import { motion } from "framer-motion";
import { Eye, Loader2 } from "lucide-react";
import { Penguin } from "@shared/schema";
import { useTheme } from "@/contexts/ThemeContext";
import { usePenguinStore } from "@/hooks/use-penguin-store";

interface PenguinCardProps {
  penguin: Penguin;
  isSeen: boolean;
  onClick: () => void;
  onInfo: () => void;
  isLoading?: boolean;
}

const cardVariants = {
  seen: {
    rotate: [0, 4, 0, -4, 0, 2, 0, -2, 0],
    y: [0, -10, 0, -7, 0],
    transition: {
      rotate: { repeat: 0, duration: 1.5, ease: "easeInOut" },
      y: { repeat: 0, duration: 1.5, ease: "easeInOut" },
    },
  },
  unseen: { rotate: 0, y: 0 },
};

export default function PenguinCard({
  penguin,
  isSeen,
  onClick,
  onInfo,
  isLoading: externalLoading,
}: PenguinCardProps) {
  const { isPenguinLoading } = usePenguinStore();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isLoading = externalLoading ?? isPenguinLoading(penguin.id);

  return (
    <motion.div
      className={`flex flex-col items-center ${isLoading ? "cursor-wait" : "cursor-pointer"}`}
      variants={cardVariants}
      animate={isSeen ? "seen" : "unseen"}
      whileHover={isLoading ? {} : { y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={isLoading ? undefined : onInfo}
    >
      <div className="relative mb-3">
        {/* Penguin image */}
        <div
          className={`rounded-full overflow-hidden h-32 w-32 transition-all duration-300 ${
            isSeen
              ? "border-[#FFD700] border-4 shadow-[0_0_15px_rgba(255,215,0,0.6)]"
              : `${isDark ? "border-white" : "border-gray-200"} border-4 shadow-lg`
          }`}
        >
          <img
            src={penguin.imageUrl}
            alt={penguin.name}
            className={`w-full h-full object-cover transition-all duration-300 ${
              !isSeen ? "grayscale" : ""
            }`}
          />
        </div>

        {/* Loading spinner */}
        {isLoading && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 rounded-full p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </motion.div>
        )}

        {/* Eye button — always visible, bottom-right; click toggles seen/unseen */}
        <motion.button
          type="button"
          aria-label={isSeen ? `Mark ${penguin.name} as unseen` : `Mark ${penguin.name} as seen`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isLoading) onClick();
          }}
          className={`absolute bottom-0 right-0 rounded-full p-1.5 border-2 border-white shadow-md transition-all duration-300 ${
            isSeen
              ? "bg-[#FFD700] text-[#7B5800] shadow-[0_0_8px_rgba(255,215,0,0.8)]"
              : isDark
              ? "bg-white/20 text-white/70 hover:bg-white/40"
              : "bg-gray-200/90 text-gray-500 hover:bg-gray-300"
          }`}
          whileTap={{ scale: 0.85 }}
        >
          <Eye className="h-4 w-4" />
        </motion.button>
      </div>

      <div className="text-center">
        <h3 className={`font-medium ${isDark ? "text-gray-100" : "text-gray-800"}`}>
          {penguin.name.replace(" Penguin", "")}
        </h3>
      </div>
    </motion.div>
  );
}
