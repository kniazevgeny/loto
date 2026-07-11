import type { Artwork, Card, Cell, GenerationResult } from "./types";

const COLUMN_RANGES: Array<[number, number]> = [
  [1, 9],
  [10, 19],
  [20, 29],
  [30, 39],
  [40, 49],
  [50, 59],
  [60, 69],
  [70, 79],
  [80, 90],
];

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: T[], random: () => number): T[] {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

function chooseNumbers(start: number, end: number, count: number, random: () => number) {
  return shuffle(
    Array.from({ length: end - start + 1 }, (_, index) => start + index),
    random,
  )
    .slice(0, count)
    .sort((a, b) => a - b);
}

function generateNumberCells(random: () => number): Array<number | null> {
  const occupied = Array.from({ length: 3 }, () => new Set<number>());
  for (let row = 0; row < 3; row += 1) {
    shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], random)
      .slice(0, 5)
      .forEach((column) => occupied[row].add(column));
  }

  const cells: Array<number | null> = Array(27).fill(null);
  for (let column = 0; column < 9; column += 1) {
    const rows = [0, 1, 2].filter((row) => occupied[row].has(column));
    const [start, end] = COLUMN_RANGES[column];
    const numbers = chooseNumbers(start, end, rows.length, random);
    rows.forEach((row, index) => {
      cells[row * 9 + column] = numbers[index];
    });
  }
  return cells;
}

function capacityIssue(cardCount: number, artworkCount: number, repeatCap: number) {
  const requiredPlacements = cardCount * 12;
  const availablePlacements = artworkCount * repeatCap;
  if (availablePlacements >= requiredPlacements && artworkCount >= 24) return undefined;
  const minimumImages = Math.max(24, Math.ceil(requiredPlacements / repeatCap));
  return {
    requiredPlacements,
    availablePlacements,
    minimumImages,
    additionalImagesNeeded: Math.max(0, minimumImages - artworkCount),
  };
}

export function generateCards(
  cardCount: number,
  artworks: Artwork[],
  repeatCap: number,
  seed: number,
): GenerationResult {
  const issue = capacityIssue(cardCount, artworks.length, repeatCap);
  if (issue) return { cards: [], usage: {}, issue };

  const random = mulberry32(seed);
  const usage: Record<string, number> = Object.fromEntries(artworks.map((item) => [item.id, 0]));
  const cards: Card[] = [];

  for (let sheetStart = 0; sheetStart < cardCount; sheetStart += 2) {
    const sheetUsed = new Set<string>();
    for (let offset = 0; offset < 2 && sheetStart + offset < cardCount; offset += 1) {
      const numberCells = generateNumberCells(random);
      const artIndexes = numberCells
        .map((number, index) => (number === null ? index : -1))
        .filter((index) => index >= 0);
      const cellArtwork = new Map<number, string>();

      for (const cellIndex of shuffle(artIndexes, random)) {
        const candidates = shuffle(artworks, random)
          .filter((artwork) => !sheetUsed.has(artwork.id) && usage[artwork.id] < repeatCap)
          .sort((a, b) => usage[a.id] - usage[b.id]);
        const selected = candidates[0];
        if (!selected) {
          return {
            cards: [],
            usage,
            issue: capacityIssue(cardCount, artworks.length, repeatCap),
          };
        }
        cellArtwork.set(cellIndex, selected.id);
        sheetUsed.add(selected.id);
        usage[selected.id] += 1;
      }

      const cells: Cell[] = numberCells.map((number, index) =>
        number === null
          ? { kind: "art", artworkId: cellArtwork.get(index)! }
          : { kind: "number", number },
      );
      cards.push({ id: crypto.randomUUID(), cells });
    }
  }

  return { cards, usage };
}

export function validateCard(card: Card) {
  const numbers = card.cells.filter((cell) => cell.kind === "number");
  const rows = [0, 1, 2].map((row) =>
    card.cells.slice(row * 9, row * 9 + 9).filter((cell) => cell.kind === "number").length,
  );
  return {
    valid: numbers.length === 15 && rows.every((count) => count === 5),
    numberCount: numbers.length,
    rowNumberCounts: rows,
  };
}
