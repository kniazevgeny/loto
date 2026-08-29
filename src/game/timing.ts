import type { GameToken } from "./types";

const NUMBER_DURATION_RATIO = .6;

export function remainingFraction(elapsedMs: number, durationMs: number) {
  if (durationMs <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - elapsedMs / durationMs));
}

export function tokenDurationMs(token: GameToken, artworkDurationMs: number) {
  return token.kind === "number" ? Math.round(artworkDurationMs * NUMBER_DURATION_RATIO) : artworkDurationMs;
}

export function estimateQueueDuration(tokens: GameToken[], artworkDurationMs: number) {
  return tokens.reduce((total, token) => total + tokenDurationMs(token, artworkDurationMs), 0);
}
