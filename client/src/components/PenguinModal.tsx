import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Penguin } from "@shared/schema";
import { Share2, Info, Book, Eye } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import ShareAchievement from "./ShareAchievement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JournalEntryList from "./JournalEntryList";

interface PenguinModalProps {
  penguin: Penguin;
  isOpen: boolean;
  onClose: () => void;
  isSeen?: boolean;
  onToggleSeen?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  "least concern": "bg-green-100 text-green-800",
  "near threatened": "bg-yellow-100 text-yellow-800",
  "vulnerable": "bg-orange-100 text-orange-800",
  "endangered": "bg-red-100 text-red-800",
  "critically endangered": "bg-red-200 text-red-900",
};

const ADDITIONAL_INFO: Record<string, string> = {
  "Little Blue Penguin": "Also known as Fairy penguins, these are the smallest penguin species in the world. They build nests in burrows, sand dunes, or rock crevices and are known for their distinct blue coloration and nocturnal habits when on land.",
  "Galápagos Penguin": "These are the only penguins found north of the equator in the wild. They have adapted to the warm climate with special behaviors like panting, seeking shade, and extending their flippers to dissipate heat. They face unique threats from El Niño events which can drastically reduce their food supply.",
  "Magellanic Penguin": "These medium-sized penguins are excellent swimmers, capable of traveling up to 170 km per day when foraging for food. They build burrows in the coastal areas and return to the same breeding site and often the same mate year after year.",
  "Humboldt Penguin": "Named after the cold water current they swim in, these penguins have a special gland above their eyes that helps them excrete excess salt. They have pink patches on their face, which help them cool down by increasing blood flow when temperatures rise.",
  "African Penguin": "Also called the 'jackass penguin' due to their donkey-like braying call. They have a distinctive pink patch above their eyes that helps regulate body temperature. Each penguin has a unique spotting pattern on its chest, like a human fingerprint.",
  "Southern Rockhopper Penguin": "Famous for their distinctive jumping behavior, these penguins hop from rock to rock rather than sliding on their bellies. They're among the most aggressive penguin species and will defend their nesting sites fiercely against intruders, including other penguin species.",
  "Northern Rockhopper Penguin": "Famous for their distinctive jumping behavior, these penguins hop from rock to rock rather than sliding on their bellies. They're among the most aggressive penguin species and will defend their nesting sites fiercely against intruders, including other penguin species.",
  "Fiordland Penguin": "One of the most secretive penguin species, they nest in the dense rainforests of New Zealand. They are known for their distinctive yellow eyebrow stripes that extend behind their eyes and drop down their necks. Males and females share incubation and chick-rearing duties equally.",
  "Snares Penguin": "These penguins live exclusively on the Snares Islands of New Zealand. They form massive breeding colonies of up to 30,000 birds. Unlike most penguins, they prefer to nest under forest canopy rather than in open areas, building nests from mud, grass, and sticks.",
  "Yellow-eyed Penguin": "One of the rarest penguin species in the world with fewer than 4,000 remaining. They are the only penguins with yellow eyes and a distinctive yellow band around their heads. Unlike most penguin species, they are solitary nesters and prefer to be well spaced from other breeding pairs.",
  "Erect-crested Penguin": "These penguins have one of the most unusual breeding behaviors—they lay two eggs but almost always abandon the first egg and raise only the second chick. Their yellow crest feathers can be raised when excited or during courtship displays, giving them their distinctive appearance.",
  "Macaroni Penguin": "Named by English sailors who thought their bright yellow crests resembled a fashionable hat called a 'macaroni.' They are one of the most numerous penguin species with an estimated 18 million individuals. They form enormous colonies, sometimes with more than 100,000 breeding pairs.",
  "Royal Penguin": "Genetically similar to Macaroni penguins, they are distinguished by their white face and chin rather than the black face of Macaronis. They breed exclusively on Macquarie Island between Australia and Antarctica, forming huge colonies of up to 500,000 breeding pairs during the summer.",
  "Adélie Penguin": "Named after the wife of French explorer Jules Dumont d'Urville, these penguins are the most widespread species in Antarctica. They build nests using small stones, and males often present pebbles to females as part of their courtship ritual. They can dive to depths of 175 meters when hunting.",
  "Gentoo Penguin": "The fastest swimming penguin species, reaching speeds up to 36 km/h (22 mph). They have the most distinctive bright orange-red bill and the largest white head patch of all penguins. Unlike many penguin species, Gentoos don't make long migrations, staying near their breeding colonies year-round.",
  "Chinstrap Penguin": "Named for the narrow black band under their head that gives the appearance of a chinstrap, these are among the most aggressive penguin species. They form enormous colonies, sometimes with millions of birds. Their harsh calls and colony density have earned their breeding sites the nickname 'penguin cities.'",
  "King Penguin": "These penguins have uniquely long breeding cycles that last over 14 months, meaning they can only produce two chicks every three years. Their young have distinct brown fluffy plumage and were once thought to be an entirely different species called 'woolly penguins' by early explorers.",
  "Emperor Penguin": "The only penguin species that breeds during the Antarctic winter, with males incubating the egg balanced on their feet in temperatures as low as -40°C. They can dive deeper than any other bird, reaching depths of over 500 meters and staying underwater for up to 20 minutes when hunting.",
};

export default function PenguinModal({ penguin, isOpen, onClose, isSeen = false, onToggleSeen }: PenguinModalProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getStatusColor = (status: string) =>
    STATUS_COLORS[status.toLowerCase()] ?? "bg-gray-100 text-gray-800";

  const handleOpenShareModal = () => {
    setShowShareModal(true);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !showShareModal} onOpenChange={onClose}>
        <DialogContent className={`sm:max-w-2xl max-h-[90vh] overflow-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle className={`text-2xl font-bold ${isDark ? 'text-blue-300' : 'text-[#1E3A8A]'} text-center`}>
              {penguin.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Details about the {penguin.name} penguin species
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <div className="relative mx-auto max-w-[280px] aspect-square">
                <div className={`rounded-full overflow-hidden shadow-md border-4 w-full h-full ${isSeen ? 'border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.6)]' : isDark ? 'border-gray-700' : 'border-white'}`}>
                  <img
                    src={penguin.imageUrl}
                    alt={penguin.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {onToggleSeen && (
                  <motion.button
                    type="button"
                    aria-label={isSeen ? `Mark ${penguin.name} as unseen` : `Mark ${penguin.name} as seen`}
                    onClick={onToggleSeen}
                    whileTap={{ scale: 0.85 }}
                    className={`absolute bottom-2 right-2 rounded-full p-3 border-2 border-white shadow-md transition-all duration-300 ${
                      isSeen
                        ? "bg-[#FFD700] text-[#7B5800] shadow-[0_0_8px_rgba(255,215,0,0.8)]"
                        : isDark
                        ? "bg-white/20 text-white/70 hover:bg-white/40"
                        : "bg-gray-200/90 text-gray-500 hover:bg-gray-300"
                    }`}
                  >
                    <Eye className="h-7 w-7" />
                  </motion.button>
                )}
              </div>
            </div>
            <div>
              <div className="mb-4">
                <h3 className={`text-sm uppercase font-medium ${isDark ? 'text-gray-300' : 'text-[#94A3B8]'} mb-1`}>Scientific Name</h3>
                <p className={`${isDark ? 'text-gray-200' : 'text-[#334155]'}`}>{penguin.scientificName}</p>
              </div>

              <div className="mb-4">
                <h3 className={`text-sm uppercase font-medium ${isDark ? 'text-gray-300' : 'text-[#94A3B8]'} mb-1`}>Location</h3>
                <p className={`${isDark ? 'text-gray-200' : 'text-[#334155]'}`}>{penguin.location}</p>
              </div>

              <div className="mb-4">
                <h3 className={`text-sm uppercase font-medium ${isDark ? 'text-gray-300' : 'text-[#94A3B8]'} mb-1`}>Size</h3>
                <p className={`${isDark ? 'text-gray-200' : 'text-[#334155]'}`}>{penguin.size}</p>
              </div>

              <div className="mb-4">
                <h3 className={`text-sm uppercase font-medium ${isDark ? 'text-gray-300' : 'text-[#94A3B8]'} mb-1`}>Weight</h3>
                <p className={`${isDark ? 'text-gray-200' : 'text-[#334155]'}`}>{penguin.weight}</p>
              </div>

              <div className="mb-4">
                <h3 className={`text-sm uppercase font-medium ${isDark ? 'text-gray-300' : 'text-[#94A3B8]'} mb-1`}>Conservation Status</h3>
                <p className={`inline-block px-4 py-1 rounded-full text-sm font-medium ${getStatusColor(penguin.status)}`}>
                  {penguin.status}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className={`w-full mb-4 ${isDark ? '' : 'bg-gray-100'}`}>
                <TabsTrigger value="info" className={`flex-1 flex items-center justify-center ${isDark ? '' : 'data-[state=active]:bg-white text-gray-700 data-[state=active]:text-gray-900 font-medium'}`}>
                  <Info className="mr-2 h-4 w-4" />
                  Information
                </TabsTrigger>
                <TabsTrigger value="journal" className={`flex-1 flex items-center justify-center ${isDark ? '' : 'data-[state=active]:bg-white text-gray-700 data-[state=active]:text-gray-900 font-medium'}`}>
                  <Book className="mr-2 h-4 w-4" />
                  Journal
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div>
                  <h3 className={`text-sm uppercase font-medium ${isDark ? 'text-gray-300' : 'text-[#94A3B8]'} mb-2`}>Description</h3>
                  <p className={`${isDark ? 'text-gray-200' : 'text-[#334155]'} mb-4`}>{penguin.description}</p>
                  {ADDITIONAL_INFO[penguin.name] && (
                    <p className={`${isDark ? 'text-gray-200' : 'text-[#334155]'}`}>
                      {ADDITIONAL_INFO[penguin.name]}
                    </p>
                  )}
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
