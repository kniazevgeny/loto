import { GOOGLE_FONTS } from "./defaults";

const loaded = new Set<string>();

export function loadGoogleFont(font: string) {
  if (!(GOOGLE_FONTS as readonly string[]).includes(font) || loaded.has(font)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, "+")}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
  loaded.add(font);
}

export async function prepareFonts(fonts: string[]) {
  fonts.forEach(loadGoogleFont);
  await document.fonts.ready;
}

export async function fontAvailable(font: string) {
  await document.fonts.ready;
  return document.fonts.check(`16px "${font}"`);
}
