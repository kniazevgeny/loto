export type MediaOrientation = "portrait" | "landscape" | "square" | "panoramic";

export function orientationFromDimensions(width: number, height: number): MediaOrientation {
  if (width === height) return "square";
  if (width < height) return "portrait";
  if (width / height >= 2.2) return "panoramic";
  return width / height < 1.12 ? "square" : "landscape";
}

export function artworkDetailCrop(width: number, height: number, x: number, y: number) {
  const size = Math.min(width, height) / 2.4;
  const left = Math.min(Math.max(0, width * x / 100 - size / 2), width - size);
  const top = Math.min(Math.max(0, height * y / 100 - size / 2), height - size);
  return { left, top, size };
}
