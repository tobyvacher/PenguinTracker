import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Penguin } from "@shared/schema";
import { X } from "lucide-react";

interface PenguinModalProps {
  penguin: Penguin;
  isOpen: boolean;
  onClose: () => void;
}

export default function PenguinModal({ penguin, isOpen, onClose }: PenguinModalProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "least concern":
        return "bg-green-100 text-green-800";
      case "near threatened":
        return "bg-yellow-100 text-yellow-800";
      case "vulnerable":
        return "bg-orange-100 text-orange-800";
      case "endangered":
        return "bg-red-100 text-red-800";
      case "critically endangered":
        return "bg-red-200 text-red-900";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader className="flex justify-between items-center">
          <div>
            <DialogTitle className="text-2xl font-bold text-[#1E3A8A]">
              {penguin.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Details about the {penguin.name} penguin species
            </DialogDescription>
          </div>
          <Button 
            variant="ghost" 
            className="text-[#94A3B8] hover:text-[#334155]"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>
            <div className="rounded-full overflow-hidden shadow-md border-4 border-white mx-auto max-w-[280px] aspect-square">
              <img 
                src={penguin.imageUrl} 
                alt={penguin.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <div className="mb-4">
              <h3 className="text-sm uppercase font-medium text-[#94A3B8] mb-1">Scientific Name</h3>
              <p className="text-[#334155]">{penguin.scientificName}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm uppercase font-medium text-[#94A3B8] mb-1">Location</h3>
              <p className="text-[#334155]">{penguin.location}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm uppercase font-medium text-[#94A3B8] mb-1">Size</h3>
              <p className="text-[#334155]">{penguin.size}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm uppercase font-medium text-[#94A3B8] mb-1">Weight</h3>
              <p className="text-[#334155]">{penguin.weight}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm uppercase font-medium text-[#94A3B8] mb-1">Conservation Status</h3>
              <p className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(penguin.status)}`}>
                {penguin.status}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm uppercase font-medium text-[#94A3B8] mb-2">Description</h3>
          <p className="text-[#334155]">{penguin.description}</p>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button 
            className="bg-[#1E3A8A] hover:bg-[#3B82F6] text-white rounded-full px-6"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
