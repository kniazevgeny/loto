export type MediaOrientation = "portrait" | "landscape" | "square" | "panoramic";

export function orientationFromDimensions(width: number, height: number): MediaOrientation {
  if (width === height) return "square";
  if (width < height) return "portrait";
  if (width / height >= 2.2) return "panoramic";
  return width / height < 1.12 ? "square" : "landscape";
}
