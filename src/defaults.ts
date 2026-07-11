import type { DesignSettings, Project } from "./types";

export const GOOGLE_FONTS = [
  "Inter",
  "Lora",
  "Merriweather",
  "Montserrat",
  "Noto Sans",
  "Noto Serif",
  "Playfair Display",
  "Roboto Slab",
] as const;

export const defaultDesign: DesignSettings = {
  cardColor: "#f8f7f2",
  cellColor: "#fffefb",
  borderColor: "#34322f",
  numberColor: "#171717",
  titleColor: "#ffffff",
  metaColor: "#eeeae3",
  borderWidthMm: 0.25,
  cellShape: "square",
  cellRadiusMm: 0,
  cardRadiusMm: 0,
  cardPaddingMm: 3,
  pageMarginXmm: 10.5,
  pageMarginYmm: 7,
  centerGapMm: 4,
  gradientOpacity: 0.76,
  numberFont: "Arial",
  titleFont: "Inter",
  metaFont: "Inter",
  numberFontSizePt: 34,
  titleFontSizePt: 8.2,
  metaFontSizePt: 5.2,
  ornament: "none",
  ornamentOpacity: 0.18,
  ornamentScale: 1,
  ornamentColor: "#856f45",
};

export function createDefaultProject(): Project {
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    name: "My art loto",
    updatedAt: new Date().toISOString(),
    seed: Math.floor(Math.random() * 1_000_000_000),
    cardCount: 24,
    repeatCap: 4,
    language: "en",
    selectedArtworkIds: [],
    customArtworks: [],
    cards: [],
    design: { ...defaultDesign },
  };
}
