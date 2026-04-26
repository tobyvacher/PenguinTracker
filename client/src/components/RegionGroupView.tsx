import { Penguin } from "@shared/schema";
import PenguinCard from "@/components/PenguinCard";
import { groupPenguinsByRegion } from "@/lib/penguin-sorting";
import { useTheme } from "@/contexts/ThemeContext";

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
  onPenguinLongPress,
}: RegionGroupViewProps) {
  const groupedPenguins = groupPenguinsByRegion(penguins);
  const sortedRegionKeys = Object.keys(groupedPenguins).sort(
    (a, b) => groupedPenguins[a].order - groupedPenguins[b].order
  );
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="space-y-10">
      {sortedRegionKeys.map((regionKey) => (
        <div key={regionKey} className="region-group">
          <h2
            className={`text-xl font-bold mb-4 border-b ${
              isDark ? "text-white border-gray-700" : "text-[#1E3A8A] border-gray-200"
            } pb-2`}
          >
            {groupedPenguins[regionKey].title}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {groupedPenguins[regionKey].penguins.map((penguin) => (
              <div key={penguin.id}>
                <PenguinCard
                  penguin={penguin}
                  isSeen={seenPenguins.includes(penguin.id)}
                  onClick={() => onPenguinClick(penguin)}
                  onInfo={() => onPenguinLongPress(penguin)}
                />
                <p
                  className={`text-xs mt-1 ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  } text-center italic`}
                >
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
