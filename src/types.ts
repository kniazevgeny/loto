export type ImageFit = "contain" | "cover";
export type ImageAnchor = "top" | "center" | "bottom";

export interface LocalizedText {
  fr?: string;
  en?: string;
  ru?: string;
  [language: string]: string | undefined;
}

export interface Artwork {
  id: string;
  imageUrl: string;
  titles: LocalizedText;
  author: string;
  year: string;
  sourceUrl?: string;
  license: "Public Domain" | "CC0" | "Custom";
  category?: "painting" | "architecture" | "sculpture" | "custom";
  fit?: ImageFit;
  anchor?: ImageAnchor;
  custom?: boolean;
}

export interface NumberCell {
  kind: "number";
  number: number;
}

export interface ArtCell {
  kind: "art";
  artworkId: string;
}

export type Cell = NumberCell | ArtCell;

export interface Card {
  id: string;
  cells: Cell[];
}

export type OrnamentKind = "none" | "corner" | "frame" | "pattern" | "custom";

export interface DesignSettings {
  cardColor: string;
  cellColor: string;
  borderColor: string;
  numberColor: string;
  titleColor: string;
  metaColor: string;
  borderWidthMm: number;
  cellShape: "square" | "rounded" | "squircle";
  cellRadiusMm: number;
  cardRadiusMm: number;
  cardPaddingMm: number;
  pageMarginXmm: number;
  pageMarginYmm: number;
  centerGapMm: number;
  gradientOpacity: number;
  numberFont: string;
  titleFont: string;
  metaFont: string;
  numberFontSizePt: number;
  titleFontSizePt: number;
  metaFontSizePt: number;
  ornament: OrnamentKind;
  ornamentOpacity: number;
  ornamentScale: number;
  ornamentColor: string;
  customOrnament?: string;
}

export interface Project {
  schemaVersion: 1;
  id: string;
  name: string;
  updatedAt: string;
  seed: number;
  cardCount: number;
  repeatCap: number;
  language: string;
  selectedArtworkIds: string[];
  customArtworks: Artwork[];
  cards: Card[];
  design: DesignSettings;
}

export interface CapacityIssue {
  requiredPlacements: number;
  availablePlacements: number;
  minimumImages: number;
  additionalImagesNeeded: number;
}

export interface GenerationResult {
  cards: Card[];
  usage: Record<string, number>;
  issue?: CapacityIssue;
}
