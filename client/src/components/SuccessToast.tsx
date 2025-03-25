import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface SuccessToastProps {
  message: string;
  isVisible: boolean;
}

export default function SuccessToast({ message, isVisible }: SuccessToastProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed bottom-4 right-4 bg-[#10B981] text-white py-3 px-6 rounded-full shadow-lg flex items-center z-50"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CheckCircle className="h-5 w-5 mr-3" />
          <p className="font-medium">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
