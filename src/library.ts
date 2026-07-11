import type { Artwork } from "./types";

export async function loadBuiltinLibrary(): Promise<Artwork[]> {
  const baseUrl = import.meta.env.BASE_URL;
  const response = await fetch(`${baseUrl}library/library.json`);
  if (!response.ok) throw new Error("La bibliothèque intégrée est introuvable.");
  const artworks = await response.json() as Artwork[];
  return artworks.map((artwork) => ({
    ...artwork,
    imageUrl: `${baseUrl}${artwork.imageUrl.replace(/^\.\//, "")}`,
  }));
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function exportProjectFile(project: unknown, name: string) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "loto-art"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
