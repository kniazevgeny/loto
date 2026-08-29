import type { Artwork } from "../types";

export type GameToken =
  | { kind: "art"; artwork: Artwork }
  | { kind: "number"; number: number };

export interface GameSetup {
  languages: string[];
  secondsPerToken: number;
  includeAllNumbers: boolean;
}

export interface GameTokenSummary {
  artworks: number;
  numbers: number;
  total: number;
  allNumberTotal: number;
}
