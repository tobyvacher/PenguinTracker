import { Penguin } from "@shared/schema";
import PenguinCard from "./PenguinCard";
import { groupPenguinsByRegion } from "@/lib/penguin-sorting";

interface RegionGroupViewProps {
  penguins: Penguin[];
  seenPenguins: number[];
  onPenguinClick: (penguin: Penguin) => void;
  onPenguinLongPress: (penguin: Penguin) => void;
}

export default function RegionGroupView({ 
  penguins,
  seenPenguins,
  onPenguinClick,
  onPenguinLongPress
}: RegionGroupViewProps) {
  // Group penguins by region
  const groupedPenguins = groupPenguinsByRegion(penguins);
  
  // Sort regions by their order
  const sortedRegionKeys = Object.keys(groupedPenguins).sort(
    (a, b) => groupedPenguins[a].order - groupedPenguins[b].order
  );

  return (
    <div className="space-y-10">
      {sortedRegionKeys.map(regionKey => (
        <div key={regionKey} className="region-group">
          <h2 className="text-xl font-bold text-[#1E3A8A] mb-4 border-b pb-2">
            {groupedPenguins[regionKey].title}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {groupedPenguins[regionKey].penguins.map(penguin => (
              <div key={penguin.id}>
                <PenguinCard
                  penguin={penguin}
                  isSeen={seenPenguins.includes(penguin.id)}
                  onClick={() => onPenguinClick(penguin)}
                  onLongPress={() => onPenguinLongPress(penguin)}
                />
                <p className="text-xs mt-1 text-gray-500 text-center italic">
                  ({penguin.scientificName})
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}