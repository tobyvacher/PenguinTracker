import { InsertPenguin } from "@shared/schema";

export const penguinData: InsertPenguin[] = [
  // Smallest penguins first
  {
    name: "Little Blue Penguin",
    scientificName: "Eudyptula minor",
    location: "Australia and New Zealand",
    size: "30-40 cm (12-16 inches) tall",
    weight: "1-1.5 kg (2.2-3.3 lb)",
    status: "Least Concern",
    description: "The Little Blue Penguin, also known as the Fairy Penguin, is the smallest species of penguin. They are found on the coastlines of southern Australia and New Zealand. The penguin's slate-blue plumage and its small size give the species its common name.",
    imageUrl: "/images/penguins/little-blue-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/little-blue-penguin.jpg"
  },
  {
    name: "Fairy Penguin",
    scientificName: "Eudyptula minor",
    location: "Australia and New Zealand",
    size: "30-33 cm (12-13 inches) tall",
    weight: "1-1.3 kg (2.2-2.9 lb)",
    status: "Least Concern",
    description: "The Fairy Penguin, also known as the Little Blue Penguin or Little Penguin, is the smallest species of penguin. They primarily feed on fish, squid, and occasionally krill. Fairy Penguins typically forage relatively close to the shore, but can travel further when necessary.",
    imageUrl: "/images/penguins/fairy-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/fairy-penguin.jpg"
  },
  {
    name: "Rockhopper Penguin",
    scientificName: "Eudyptes chrysocome",
    location: "Sub-Antarctic islands",
    size: "45-58 cm (18-23 inches) tall",
    weight: "2-3.4 kg (4.4-7.5 lb)",
    status: "Vulnerable",
    description: "Rockhopper Penguins are among the smallest species of penguin in the world. They are the most aggressive and numerous of all crested penguins. Rockhopper Penguins are distinguished by the straight, yellow feathers that rise from their heads. They have blood-red eyes, a red-orange beak, and pink webbed feet.",
    imageUrl: "/images/penguins/rockhopper-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/rockhopper-penguin.jpg"
  },
  {
    name: "Adélie Penguin",
    scientificName: "Pygoscelis adeliae",
    location: "Antarctica coastline",
    size: "46-71 cm (18-28 inches) tall",
    weight: "3.6-6 kg (7.9-13.2 lb)",
    status: "Least Concern",
    description: "The Adélie Penguin is a species of penguin common along the entire coast of the Antarctic continent. They are among the most southerly distributed of all seabirds. Adélie Penguins are named after Adélie Land, which in turn was named for the wife of French explorer Jules Dumont d'Urville who discovered these penguins in 1840.",
    imageUrl: "/images/penguins/adelie-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/adelie-penguin.jpg"
  },
  {
    name: "Galápagos Penguin",
    scientificName: "Spheniscus mendiculus",
    location: "Galápagos Islands",
    size: "49-53 cm (19-21 inches) tall",
    weight: "2.1-3.7 kg (4.6-8.2 lb)",
    status: "Endangered",
    description: "The Galápagos Penguin is a penguin species that is endemic to the Galápagos Islands. It is the only penguin found north of the equator and is the most endangered and rarest of penguin species with fewer than 2,000 individuals.",
    imageUrl: "/images/penguins/galapagos-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/galapagos-penguin.jpg"
  },
  {
    name: "Snares Penguin",
    scientificName: "Eudyptes robustus",
    location: "Snares Islands, New Zealand",
    size: "50-70 cm (20-28 inches) tall",
    weight: "2.5-4 kg (5.5-8.8 lb)",
    status: "Vulnerable",
    description: "The Snares Penguin, also known as the Snares Crested Penguin, is a penguin from New Zealand. The species breeds on The Snares, a group of islands off the southern coast of New Zealand. These penguins have a bright yellow crest, red-brown bill, and pink skin at the base of the bill.",
    imageUrl: "/images/penguins/snares-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/snares-penguin.jpg"
  },
  {
    name: "Erect-crested Penguin",
    scientificName: "Eudyptes sclateri",
    location: "New Zealand sub-Antarctic islands",
    size: "50-70 cm (20-28 inches) tall",
    weight: "2.5-6 kg (5.5-13.2 lb)",
    status: "Endangered",
    description: "The Erect-crested Penguin is a species of penguin endemic to New Zealand. It breeds on the Bounty and Antipodes Islands, with individuals occasionally visiting New Zealand's eastern coasts. This penguin has black upper parts, white underparts, and a yellow crest that begins at the base of the bill and extends backward.",
    imageUrl: "/images/penguins/erect-crested-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/erect-crested-penguin.jpg"
  },
  {
    name: "Gentoo Penguin",
    scientificName: "Pygoscelis papua",
    location: "Antarctic Peninsula and sub-Antarctic islands",
    size: "51-90 cm (20-35 inches) tall",
    weight: "4.5-8.5 kg (9.9-18.7 lb)",
    status: "Least Concern",
    description: "The Gentoo Penguin is recognizable by the wide white stripe extending like a bonnet across the top of its head and its bright orange-red bill. They have the most prominent tail of all penguin species. Gentoos are the fastest underwater swimming penguins, reaching speeds of 36 km/h (22 mph).",
    imageUrl: "/images/penguins/gentoo-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/gentoo-penguin.jpg"
  },
  {
    name: "Fiordland Penguin",
    scientificName: "Eudyptes pachyrhynchus",
    location: "New Zealand",
    size: "55-60 cm (22-24 inches) tall",
    weight: "2.5-5 kg (5.5-11 lb)",
    status: "Vulnerable",
    description: "The Fiordland Penguin is native to the Fiordland region of the southwestern New Zealand. It has a distinctive appearance with a broad yellow stripe that starts above the eye and drops down the neck. These penguins prefer dense forests for breeding, which is unusual among penguin species. They are also known as Fiordland Crested Penguins.",
    imageUrl: "/images/penguins/fiordland-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/fiordland-penguin.jpg"
  },
  {
    name: "African Penguin",
    scientificName: "Spheniscus demersus",
    location: "Southern Africa",
    size: "60-70 cm (24-28 inches) tall",
    weight: "2.2-3.5 kg (4.9-7.7 lb)",
    status: "Endangered",
    description: "The African Penguin, also known as the Black-footed Penguin, is a species found on the southwestern coast of Africa. It is the only penguin species that breeds in Africa and its presence gave name to the Penguin Islands. The African Penguin has distinctive pink patches of skin above the eyes and a black facial mask.",
    imageUrl: "/images/penguins/african-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/african-penguin.jpg"
  },
  {
    name: "Magellanic Penguin",
    scientificName: "Spheniscus magellanicus",
    location: "South America",
    size: "60-75 cm (24-30 inches) tall",
    weight: "2.7-6.5 kg (6-14.3 lb)",
    status: "Near Threatened",
    description: "The Magellanic Penguin is a South American penguin, breeding in coastal Argentina, Chile and the Falkland Islands. This penguin is named after Portuguese explorer Ferdinand Magellan, who spotted the birds in 1520. Magellanic Penguins are medium-sized penguins with distinctive white bands that loop over the eye, down the sides of the neck, and meet at the throat.",
    imageUrl: "/images/penguins/magellanic-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/magellanic-penguin.jpg"
  },
  {
    name: "Humboldt Penguin",
    scientificName: "Spheniscus humboldti",
    location: "South America (Peru and Chile)",
    size: "65-70 cm (26-28 inches) tall",
    weight: "4-5 kg (8.8-11 lb)",
    status: "Vulnerable",
    description: "The Humboldt Penguin is found in South America and breeds in coastal Peru and Chile. This medium-sized penguin is named after the cold water current it swims in, which itself is named after explorer Alexander von Humboldt. These penguins have a black head with a white border running from the eyes to the chest and around the neck.",
    imageUrl: "/images/penguins/humboldt-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/humboldt-penguin.jpg"
  },
  {
    name: "Royal Penguin",
    scientificName: "Eudyptes schlegeli",
    location: "Macquarie Island, Australia",
    size: "65-76 cm (26-30 inches) tall",
    weight: "4-5.5 kg (8.8-12.1 lb)",
    status: "Near Threatened",
    description: "The Royal Penguin is endemic to Macquarie Island, an Australian territory in the southwest Pacific. They are distinguished by the white face and chin instead of the black face and chin of Macaroni penguins. Royal penguins nest on beaches or on bare areas on slopes covered with vegetation. They form large colonies on Macquarie Island.",
    imageUrl: "/images/penguins/royal-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/royal-penguin.jpg"
  },
  {
    name: "Chinstrap Penguin",
    scientificName: "Pygoscelis antarcticus",
    location: "Antarctic Peninsula and islands",
    size: "68-76 cm (27-30 inches) tall",
    weight: "3-5 kg (6.6-11 lb)",
    status: "Least Concern",
    description: "The Chinstrap Penguin is named for the narrow black band under its head which makes it appear as if it were wearing a black helmet. It is also known as the Ringed Penguin, Bearded Penguin, or Stone-cracker Penguin due to its loud, harsh call.",
    imageUrl: "/images/penguins/chinstrap-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/chinstrap-penguin.jpg"
  },
  {
    name: "Macaroni Penguin",
    scientificName: "Eudyptes chrysolophus",
    location: "Sub-Antarctic and Antarctic Peninsula",
    size: "70 cm (28 inches) tall",
    weight: "5.5 kg (12 lb)",
    status: "Vulnerable",
    description: "The Macaroni Penguin is a species of penguin found from the Subantarctic to the Antarctic Peninsula. One of six species of crested penguin, it bears a distinctive yellow crest, and has a large, bright orange-red bill. These penguins feed primarily on krill, along with fish and squid, and obtain all their food from the sea.",
    imageUrl: "/images/penguins/macaroni-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/macaroni-penguin.jpg"
  },
  {
    name: "Yellow-eyed Penguin",
    scientificName: "Megadyptes antipodes",
    location: "New Zealand",
    size: "62-79 cm (24-31 inches) tall",
    weight: "4-8 kg (8.8-17.6 lb)",
    status: "Endangered",
    description: "The Yellow-eyed Penguin is native to New Zealand and is one of the rarest penguin species in the world. It is distinguished by a band of bright yellow feathers that extends from its eyes around the back of its head. The Yellow-eyed Penguin is a solitary, monogamous species that nests in forests and scrub along the shoreline.",
    imageUrl: "/images/penguins/yellow-eyed-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/yellow-eyed-penguin.jpg"
  },
  {
    name: "King Penguin",
    scientificName: "Aptenodytes patagonicus",
    location: "Sub-Antarctic islands",
    size: "70-100 cm (28-39 inches) tall",
    weight: "11-16 kg (24-35 lb)",
    status: "Least Concern",
    description: "The King Penguin is the second largest species of penguin, smaller, but somewhat similar in appearance to the Emperor Penguin. King penguins eat small fish, mainly lanternfish, and squid. They are less reliant on ice than Emperor Penguins, breeding on sub-Antarctic islands at the northern reaches of Antarctica, South Georgia, and other temperate islands of the region.",
    imageUrl: "/images/penguins/king-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/king-penguin.jpg"
  },
  {
    name: "Emperor Penguin",
    scientificName: "Aptenodytes forsteri",
    location: "Antarctica",
    size: "100-130 cm (39-51 inches) tall",
    weight: "22-45 kg (49-99 lb)",
    status: "Near Threatened",
    description: "The Emperor Penguin is the tallest and heaviest of all living penguin species and is endemic to Antarctica. The male and female are similar in plumage and size. The Emperor Penguin's diet consists primarily of fish, but can also include crustaceans and squid. In hunting, the penguin can remain submerged for up to 18 minutes, diving to depths of 535 m (1,755 ft).",
    imageUrl: "/images/penguins/emperor-penguin.jpg",
    bwImageUrl: "/images/penguins/bw/emperor-penguin.jpg"
  }
];
