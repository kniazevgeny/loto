import type { Artwork, Project } from "../types";
import type { GameToken, GameTokenSummary } from "./types";

export function shuffle<T>(items: T[], random = Math.random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildGameQueue(
  project: Pick<Project, "cards">,
  artworks: Map<string, Artwork>,
  includeAllNumbers: boolean,
  random = Math.random,
): GameToken[] {
  const artworkIds = new Set<string>();
  const usedNumbers = new Set<number>();

  for (const card of project.cards) {
    for (const cell of card.cells) {
      if (cell.kind === "art") artworkIds.add(cell.artworkId);
      if (cell.kind === "number") usedNumbers.add(cell.number);
    }
  }

  const artTokens: GameToken[] = [...artworkIds]
    .map((artworkId) => artworks.get(artworkId))
    .filter((artwork): artwork is Artwork => Boolean(artwork))
    .map((artwork) => ({ kind: "art", artwork }));
  const numbers = includeAllNumbers ? Array.from({ length: 90 }, (_, index) => index + 1) : [...usedNumbers];
  const numberTokens: GameToken[] = numbers.map((number) => ({ kind: "number", number }));

  return shuffle([...artTokens, ...numberTokens], random);
}

export function estimateGameDuration(tokenCount: number, secondsPerToken: number) {
  return tokenCount * secondsPerToken;
}

export function summarizeGameTokens(tokens: GameToken[]): GameTokenSummary {
  const artworks = tokens.filter((token) => token.kind === "art").length;
  const numbers = tokens.length - artworks;
  return { artworks, numbers, total: tokens.length, allNumberTotal: artworks + 90 };
}

export function formatDuration(totalSeconds: number, language: string) {
  const minutes = Math.max(1, Math.ceil(totalSeconds / 60));
  const minuteLabel = language === "fr" ? "min" : language === "ru" ? "мин" : "min";
  return `${minutes} ${minuteLabel}`;
}
