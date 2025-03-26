import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Penguin, SightingJournal } from "@shared/schema";
import { Share2, Info, Book, Plus } from "lucide-react";
import { useState } from "react";
import ShareAchievement from "./ShareAchievement";
import SocialShareButtons from "./SocialShareButtons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JournalEntryList from "./JournalEntryList";
import JournalEntryForm from "./JournalEntryForm";

interface PenguinModalProps {
  penguin: Penguin;
  isOpen: boolean;
  onClose: () => void;
}

export default function PenguinModal({ penguin, isOpen, onClose }: PenguinModalProps) {
  const [showShareModal, setShowShareModal] = useState(false);
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

  // Function to get the additional information paragraph based on penguin name
  const getAdditionalInfo = (name: string): string => {
    switch (name) {
      case "Little Blue Penguin":
        return "Also known as Fairy penguins, these are the smallest penguin species in the world. They build nests in burrows, sand dunes, or rock crevices and are known for their distinct blue coloration and nocturnal habits when on land.";
      case "Galapagos Penguin":
        return "These are the only penguins found north of the equator in the wild. They have adapted to the warm climate with special behaviors like panting, seeking shade, and extending their flippers to dissipate heat. They face unique threats from El Niño events which can drastically reduce their food supply.";
      case "Magellanic Penguin":
        return "These medium-sized penguins are excellent swimmers, capable of traveling up to 170 km per day when foraging for food. They build burrows in the coastal areas and return to the same breeding site and often the same mate year after year.";
      case "Humboldt Penguin":
        return "Named after the cold water current they swim in, these penguins have a special gland above their eyes that helps them excrete excess salt. They have pink patches on their face, which help them cool down by increasing blood flow when temperatures rise.";
      case "African Penguin":
        return "Also called the 'jackass penguin' due to their donkey-like braying call. They have a distinctive pink patch above their eyes that helps regulate body temperature. Each penguin has a unique spotting pattern on its chest, like a human fingerprint.";
      case "Rockhopper Penguin":
        return "Famous for their distinctive jumping behavior, these penguins hop from rock to rock rather than sliding on their bellies. They're among the most aggressive penguin species and will defend their nesting sites fiercely against intruders, including other penguin species.";
      case "Fiordland Penguin":
        return "One of the most secretive penguin species, they nest in the dense rainforests of New Zealand. They are known for their distinctive yellow eyebrow stripes that extend behind their eyes and drop down their necks. Males and females share incubation and chick-rearing duties equally.";
      case "Snares Penguin":
        return "These penguins live exclusively on the Snares Islands of New Zealand. They form massive breeding colonies of up to 30,000 birds. Unlike most penguins, they prefer to nest under forest canopy rather than in open areas, building nests from mud, grass, and sticks.";
      case "Yellow-eyed Penguin":
        return "One of the rarest penguin species in the world with fewer than 4,000 remaining. They are the only penguins with yellow eyes and a distinctive yellow band around their heads. Unlike most penguin species, they are solitary nesters and prefer to be well spaced from other breeding pairs.";
      case "Erect-crested Penguin":
        return "These penguins have one of the most unusual breeding behaviors—they lay two eggs but almost always abandon the first egg and raise only the second chick. Their yellow crest feathers can be raised when excited or during courtship displays, giving them their distinctive appearance.";
      case "Macaroni Penguin":
        return "Named by English sailors who thought their bright yellow crests resembled a fashionable hat called a 'macaroni.' They are one of the most numerous penguin species with an estimated 18 million individuals. They form enormous colonies, sometimes with more than 100,000 breeding pairs.";
      case "Royal Penguin":
        return "Genetically similar to Macaroni penguins, they are distinguished by their white face and chin rather than the black face of Macaronis. They breed exclusively on Macquarie Island between Australia and Antarctica, forming huge colonies of up to 500,000 breeding pairs during the summer.";
      case "Adelie Penguin":
        return "Named after the wife of French explorer Jules Dumont d'Urville, these penguins are the most widespread species in Antarctica. They build nests using small stones, and males often present pebbles to females as part of their courtship ritual. They can dive to depths of 175 meters when hunting.";
      case "Gentoo Penguin":
        return "The fastest swimming penguin species, reaching speeds up to 36 km/h (22 mph). They have the most distinctive bright orange-red bill and the largest white head patch of all penguins. Unlike many penguin species, Gentoos don't make long migrations, staying near their breeding colonies year-round.";
      case "Chinstrap Penguin":
        return "Named for the narrow black band under their head that gives the appearance of a chinstrap, these are among the most aggressive penguin species. They form enormous colonies, sometimes with millions of birds. Their harsh calls and colony density have earned their breeding sites the nickname 'penguin cities.'";
      case "King Penguin":
        return "These penguins have uniquely long breeding cycles that last over 14 months, meaning they can only produce two chicks every three years. Their young have distinct brown fluffy plumage and were once thought to be an entirely different species called 'woolly penguins' by early explorers.";
      case "Emperor Penguin":
        return "The only penguin species that breeds during the Antarctic winter, with males incubating the egg balanced on their feet in temperatures as low as -40°C. They can dive deeper than any other bird, reaching depths of over 500 meters and staying underwater for up to 20 minutes when hunting.";
      case "Fairy Penguin":
        return "A subspecies of the Little Blue Penguin, these tiny penguins are extremely vocal with a range of calls from low growls to loud trumpeting sounds. They are the smallest penguin species and are the only penguin with blue rather than black feathers. At night, their feathers can appear to glow blue under certain light conditions.";
      default:
        return "";
    }
  };

  // Handle opening the share modal
  const handleOpenShareModal = () => {
    setShowShareModal(true);
    onClose(); // Close the penguin modal when opening the share modal
  };

  return (
    <>
      <Dialog open={isOpen && !showShareModal} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#1E3A8A] text-center">
              {penguin.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Details about the {penguin.name} penguin species
            </DialogDescription>
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
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="info" className="flex-1 flex items-center justify-center">
                  <Info className="mr-2 h-4 w-4" />
                  Information
                </TabsTrigger>
                <TabsTrigger value="journal" className="flex-1 flex items-center justify-center">
                  <Book className="mr-2 h-4 w-4" />
                  Journal
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div>
                  <h3 className="text-sm uppercase font-medium text-[#94A3B8] mb-2">Description</h3>
                  <p className="text-[#334155] mb-4">{penguin.description}</p>
                  
                  <p className="text-[#334155]">
                    {getAdditionalInfo(penguin.name)}
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="journal">
                <JournalEntryList penguin={penguin} />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="mt-6 flex justify-between">
            <Button 
              className="bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-full px-6 flex items-center gap-2"
              onClick={handleOpenShareModal}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button 
              className="bg-[#1E3A8A] hover:bg-[#3B82F6] text-white rounded-full px-6"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <ShareAchievement
        title="Share Your Penguin Sighting!"
        message={`I spotted the ${penguin.name}!`}
        penguin={penguin}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </>
  );
}
