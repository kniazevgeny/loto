import type { Artwork } from "../types";
import type { GameToken } from "./types";

// Exact union of the artworks on both archived 20-card editions in print/.
// Keep this independent of the current library selection and card generator.
const printedArtworkIds = [
  "cc0-borobudur",
  "commons-arrangement-en-gris-et-noir-n1",
  "commons-autoportrait",
  "commons-bonaparte-franchissant-les-alpes",
  "commons-chasseurs-dans-la-neige",
  "commons-flaming-june",
  "commons-impression-soleil-levant",
  "commons-l-anglus",
  "commons-l-cole-d-athnes",
  "commons-l-homme-de-vitruve",
  "commons-la-chambre-arles",
  "commons-la-charrette-de-foin",
  "commons-la-cne",
  "commons-la-cration-d-adam",
  "commons-la-dame-de-shalott",
  "commons-la-femme-l-ombrelle",
  "commons-la-fiance-juive",
  "commons-la-grande-odalisque",
  "commons-la-grande-vague-de-kanagawa",
  "commons-la-jeune-fille-la-perle",
  "commons-la-joconde",
  "commons-la-laitire",
  "commons-la-leon-d-anatomie",
  "commons-la-libert-guidant-le-peuple",
  "commons-la-liseuse-la-fentre",
  "commons-la-madone-sixtine",
  "commons-la-maja-nue",
  "commons-la-mer-de-glace",
  "commons-la-mort-de-marat",
  "commons-la-naissance-de-vnus",
  "commons-la-nuit-toile",
  "commons-la-ronde-de-nuit",
  "commons-la-tour-de-babel",
  "commons-la-transfiguration",
  "commons-le-3-mai-1808",
  "commons-le-baiser",
  "commons-le-cri",
  "commons-le-dernier-voyage-du-tmraire",
  "commons-le-djeuner-sur-l-herbe",
  "commons-le-fuji-rouge",
  "commons-le-moine-au-bord-de-la-mer",
  "commons-le-printemps",
  "commons-le-radeau-de-la-mduse",
  "commons-le-sacre-de-napolon",
  "commons-le-serment-des-horaces",
  "commons-les-glaneuses",
  "commons-les-iris",
  "commons-les-mnines",
  "commons-les-nymphas",
  "commons-les-tournesols",
  "commons-olympia",
  "commons-ophlie",
  "commons-pluie-vapeur-et-vitesse",
  "commons-saturne-dvorant-un-de-ses-fils",
  "commons-terrasse-du-caf-le-soir",
  "commons-un-bar-aux-folies-bergre",
  "commons-voyageur-contemplant-une-mer-de-nuages",
  "commons-vue-de-delft",
  "met-10482",
  "met-10508",
  "met-12266",
  "met-195733",
  "met-253370",
  "met-255408",
  "met-271707",
  "met-282068",
  "met-310870",
  "met-318622",
  "met-337538",
  "met-437244",
  "met-441357",
  "met-544442",
  "met-544450",
  "met-75414",
  "pd-angkor-wat",
];

const printedNumbers = Array.from({ length: 90 }, (_, index) => index + 1).filter((number) => number !== 8 && number !== 47);

export function buildPrintedGameQueue(artworks: Map<string, Artwork>): GameToken[] {
  const tokens: GameToken[] = [];
  for (const id of printedArtworkIds) {
    const artwork = artworks.get(id);
    if (!artwork) return []; // Never start a round with an incomplete printed pool.
    tokens.push({ kind: "art", artwork });
  }
  for (const number of printedNumbers) tokens.push({ kind: "number", number });
  return tokens;
}