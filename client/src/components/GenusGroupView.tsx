import { Penguin } from "@shared/schema";
import PenguinCard from "@/components/PenguinCard";
import { getFriendlyGenusName, groupPenguinsByGenus } from "@/lib/penguin-sorting";
import { useState, useEffect } from "react";

interface GenusGroupViewProps {
  penguins: Penguin[];
  seenPenguins: number[];
  onPenguinClick: (penguin: Penguin) => void;
  onPenguinLongPress: (penguin: Penguin) => void;
}

export default function GenusGroupView({ 
  penguins, 
  seenPenguins, 
  onPenguinClick, 
  onPenguinLongPress 
}: GenusGroupViewProps) {
  // Group penguins by genus
  const groupedPenguins = groupPenguinsByGenus(penguins);
  
  // Get sorted genus names for consistent ordering
  const genusNames = Object.keys(groupedPenguins).sort();

  return (
    <div className="space-y-8">
      {genusNames.map(genus => (
        <div key={genus} className="mb-6">
          <h2 className="text-xl font-bold text-[#1E3A8A] mb-4 border-b border-gray-200 pb-2">
            {getFriendlyGenusName(genus)}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {groupedPenguins[genus].map((penguin) => (
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