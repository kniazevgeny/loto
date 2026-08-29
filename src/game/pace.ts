export const PACE_LEVELS = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3.5, 3, 2.5, 2, 1.5, 1] as const;
export const MAX_PACE_SLIDER_VALUE = PACE_LEVELS.length - 1;
export const MIN_ARTWORK_SECONDS = PACE_LEVELS[PACE_LEVELS.length - 1];
export const MAX_ARTWORK_SECONDS = PACE_LEVELS[0];
const OVERDRIVE_START_SECONDS = 3;

export function clampArtworkSeconds(seconds: number) {
  return PACE_LEVELS[nearestPaceIndex(seconds)];
}

export function sliderValueFromSeconds(seconds: number) {
  return nearestPaceIndex(seconds);
}

export function secondsFromSliderValue(value: number) {
  const index = Math.max(0, Math.min(MAX_PACE_SLIDER_VALUE, Math.round(value)));
  return PACE_LEVELS[index];
}

export function fasterSeconds(seconds: number) {
  return PACE_LEVELS[Math.min(MAX_PACE_SLIDER_VALUE, nearestPaceIndex(seconds) + 1)];
}

export function slowerSeconds(seconds: number) {
  return PACE_LEVELS[Math.max(0, nearestPaceIndex(seconds) - 1)];
}

export function speedometerNeedleAngle(seconds: number) {
  const clamped = clampArtworkSeconds(seconds);
  if (clamped < OVERDRIVE_START_SECONDS) {
    return 62 + ((OVERDRIVE_START_SECONDS - clamped) / (OVERDRIVE_START_SECONDS - MIN_ARTWORK_SECONDS)) * 22;
  }
  const speedProgress = (MAX_ARTWORK_SECONDS - clamped) / (MAX_ARTWORK_SECONDS - OVERDRIVE_START_SECONDS);
  return -62 + speedProgress * 124;
}

const DECIMAL_COMMA_LANGUAGES = new Set(["ru", "fr"]);

export function formatSeconds(seconds: number, language: string) {
  const rounded = Math.round(seconds * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return DECIMAL_COMMA_LANGUAGES.has(language) ? text.replace(".", ",") : text;
}

function nearestPaceIndex(seconds: number) {
  let nearest = 0;
  for (let index = 1; index < PACE_LEVELS.length; index += 1) {
    if (Math.abs(PACE_LEVELS[index] - seconds) < Math.abs(PACE_LEVELS[nearest] - seconds)) nearest = index;
  }
  return nearest;
}
