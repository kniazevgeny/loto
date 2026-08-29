import type { Artwork, ArtCell, Card, Cell, GenerationResult } from "./types";

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

interface BentoSpec {
  colSpan: 1 | 2;
  rowSpan: 1 | 2;
}

interface BentoPlacement extends BentoSpec {
  index: number;
}

type ArtworkSpan = "1x1" | "2x1" | "1x2" | "2x2";

type SpanUsage = Record<ArtworkSpan, number>;

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

function bentoSpecs(cardIndex: number, enabled: boolean): BentoSpec[] {
  if (!enabled) return [];
  return [
    { colSpan: 2, rowSpan: 2 },
    cardIndex % 2 === 0 ? { colSpan: 2, rowSpan: 1 } : { colSpan: 1, rowSpan: 2 },
  ];
}

function artworkPlacements(cardIndex: number, enabled: boolean) {
  return 12 - bentoSpecs(cardIndex, enabled)
    .reduce((coveredSlots, spec) => coveredSlots + spec.colSpan * spec.rowSpan - 1, 0);
}

export function requiredArtworkPlacements(cardCount: number, bentoEnabled: boolean) {
  return Array.from(
    { length: cardCount },
    (_, cardIndex) => artworkPlacements(cardIndex, bentoEnabled),
  ).reduce((sum, count) => sum + count, 0);
}

function capacityIssue(cardCount: number, artworkCount: number, repeatCap: number, bentoEnabled: boolean) {
  const requiredPlacements = requiredArtworkPlacements(cardCount, bentoEnabled);
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

function indexesFor(placement: BentoPlacement) {
  const row = Math.floor(placement.index / 9);
  const column = placement.index % 9;
  const indexes: number[] = [];
  for (let rowOffset = 0; rowOffset < placement.rowSpan; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < placement.colSpan; columnOffset += 1) {
      indexes.push((row + rowOffset) * 9 + column + columnOffset);
    }
  }
  return indexes;
}

function placementCandidates(spec: BentoSpec) {
  const candidates: BentoPlacement[] = [];
  for (let row = 0; row <= 3 - spec.rowSpan; row += 1) {
    for (let column = 0; column <= 9 - spec.colSpan; column += 1) {
      candidates.push({ ...spec, index: row * 9 + column });
    }
  }
  return candidates;
}

function placementsAreSeparated(first: BentoPlacement, second: BentoPlacement) {
  const firstRow = Math.floor(first.index / 9);
  const firstColumn = first.index % 9;
  const secondRow = Math.floor(second.index / 9);
  const secondColumn = second.index % 9;
  return firstColumn - 1 > secondColumn + second.colSpan - 1
    || firstColumn + first.colSpan < secondColumn
    || firstRow - 1 > secondRow + second.rowSpan - 1
    || firstRow + first.rowSpan < secondRow;
}

function placementSlots(placements: BentoPlacement[]) {
  const reserved = new Set<number>();
  const preferredNumbers = new Set<number>();
  for (const placement of placements) {
    indexesFor(placement).forEach((index) => reserved.add(index));
    const originRow = Math.floor(placement.index / 9);
    const originColumn = placement.index % 9;
    for (let row = 0; row < 3; row += 1) {
      if (row >= originRow && row < originRow + placement.rowSpan) continue;
      for (let columnOffset = 0; columnOffset < placement.colSpan; columnOffset += 1) {
        preferredNumbers.add(row * 9 + originColumn + columnOffset);
      }
    }
  }
  return { reserved, preferredNumbers };
}

function combinations(values: number[], count: number): number[][] {
  if (count === 0) return [[]];
  if (values.length < count) return [];
  return values.flatMap((value, index) =>
    combinations(values.slice(index + 1), count - 1).map((rest) => [value, ...rest]),
  );
}

function miniatureAdjacencyScore(indexes: number[]) {
  const columns = indexes.map((index) => index % 9).sort((a, b) => a - b);
  let adjacentPairs = 0;
  let runLength = 1;
  let longestRun = columns.length ? 1 : 0;
  for (let index = 1; index < columns.length; index += 1) {
    if (columns[index] === columns[index - 1] + 1) {
      adjacentPairs += 1;
      runLength += 1;
      longestRun = Math.max(longestRun, runLength);
    } else {
      runLength = 1;
    }
  }
  return { adjacentPairs, longestRun };
}

function longestEmptyRun(artColumns: Set<number>) {
  let longest = 0;
  let current = 0;
  for (let column = 0; column < 9; column += 1) {
    current = artColumns.has(column) ? 0 : current + 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

function chooseMiniatureIndexes(
  candidates: number[],
  count: number,
  reservedIndexes: number[],
  preferredNumbers: Set<number>,
  forbiddenVerticalColumns = new Set<number>(),
  random?: () => number,
) {
  const valid = combinations(candidates, count)
    .filter((indexes) => miniatureAdjacencyScore(indexes).longestRun < 3)
    .filter((indexes) => indexes.every((index) => !forbiddenVerticalColumns.has(index % 9)));
  if (!valid.length) return undefined;
  const ordered = random ? shuffle(valid, random) : valid;
  const score = (indexes: number[]) => {
    const artColumns = new Set([...reservedIndexes, ...indexes].map((index) => index % 9));
    return longestEmptyRun(artColumns) * 100
      + miniatureAdjacencyScore(indexes).adjacentPairs * 10
      + indexes.filter((index) => preferredNumbers.has(index)).length;
  };
  return ordered
    .map((indexes) => ({ indexes, score: score(indexes) }))
    .sort((a, b) => a.score - b.score)[0].indexes;
}

function placementsAreFeasible(placements: BentoPlacement[]) {
  const { reserved } = placementSlots(placements);
  for (let row = 0; row < 3; row += 1) {
    const rowIndexes = Array.from({ length: 9 }, (_, column) => row * 9 + column);
    const reservedIndexes = rowIndexes.filter((index) => reserved.has(index));
    if (reservedIndexes.length > 3 || rowIndexes.length - reservedIndexes.length < 4 - reservedIndexes.length) return false;
  }
  return true;
}

function chooseBentoPlacements(
  specs: BentoSpec[],
  previousColumn: number | undefined,
  random: () => number,
) {
  if (!specs.length) return [];
  const firstCandidates = placementCandidates(specs[0]);
  const distributed = previousColumn === undefined
    ? firstCandidates
    : firstCandidates.filter((placement) => Math.abs(placement.index % 9 - previousColumn) >= 3);
  const pairs = (distributed.length ? distributed : firstCandidates).flatMap((first) =>
    placementCandidates(specs[1]).flatMap((second) =>
      placementsAreSeparated(first, second) && placementsAreFeasible([first, second])
        ? [[first, second] as BentoPlacement[]]
        : [],
    ),
  );
  const selected = shuffle(pairs, random)[0];
  if (!selected) throw new Error("No valid bento placement found");
  return selected;
}

function generateArtMask(
  placements: BentoPlacement[],
  random: () => number,
): { artIndexes: Set<number>; coveredOwners: Map<number, number> } {
  const { reserved, preferredNumbers } = placementSlots(placements);
  const artIndexes = new Set(reserved);
  const coveredOwners = new Map<number, number>();
  const miniatureColumns: Array<Set<number>> = [];

  for (const placement of placements) {
    indexesFor(placement).forEach((index) => {
      if (index !== placement.index) coveredOwners.set(index, placement.index);
    });
  }

  for (let row = 0; row < 3; row += 1) {
    const reservedIndexes = [...artIndexes].filter((index) => Math.floor(index / 9) === row);
    const candidates = Array.from({ length: 9 }, (_, column) => row * 9 + column)
      .filter((index) => !artIndexes.has(index));
    const forbiddenVerticalColumns = row === 2
      ? new Set([...miniatureColumns[0]].filter((column) => miniatureColumns[1].has(column)))
      : new Set<number>();
    const selected = chooseMiniatureIndexes(
      candidates,
      4 - reservedIndexes.length,
      reservedIndexes,
      preferredNumbers,
      forbiddenVerticalColumns,
      random,
    );
    if (!selected) throw new Error("No valid miniature distribution found");
    miniatureColumns.push(new Set(selected.map((index) => index % 9)));
    selected.forEach((index) => artIndexes.add(index));
  }

  return { artIndexes, coveredOwners };
}

function generateNumberCells(artIndexes: Set<number>, random: () => number): Array<number | null> {
  const cells: Array<number | null> = Array(27).fill(null);
  for (let column = 0; column < 9; column += 1) {
    const rows = [0, 1, 2].filter((row) => !artIndexes.has(row * 9 + column));
    const [start, end] = COLUMN_RANGES[column];
    const numbers = chooseNumbers(start, end, rows.length, random);
    rows.forEach((row, index) => {
      cells[row * 9 + column] = numbers[index];
    });
  }
  return cells;
}

function aspectScore(artwork: Artwork, spec: BentoSpec) {
  const ratio = artwork.aspectRatio || 1;
  if (spec.colSpan === 2 && spec.rowSpan === 1) return Math.abs(ratio - 1.8);
  if (spec.colSpan === 1 && spec.rowSpan === 2) return Math.abs(ratio - 0.56);
  return Math.abs(ratio - 1);
}

function matchesOrientation(artwork: Artwork, spec: BentoSpec) {
  const ratio = artwork.aspectRatio || 1;
  if (spec.colSpan === 2 && spec.rowSpan === 1) return ratio >= 0.9;
  if (spec.colSpan === 1 && spec.rowSpan === 2) return ratio <= 1.1;
  return true;
}

function spanFor(placement: BentoPlacement | undefined): ArtworkSpan {
  if (!placement) return "1x1";
  return `${placement.colSpan}x${placement.rowSpan}` as ArtworkSpan;
}

function emptySpanUsage(): SpanUsage {
  return { "1x1": 0, "2x1": 0, "1x2": 0, "2x2": 0 };
}

export function generateCards(
  cardCount: number,
  artworks: Artwork[],
  repeatCap: number,
  seed: number,
  bentoEnabled = true,
): GenerationResult {
  const issue = capacityIssue(cardCount, artworks.length, repeatCap, bentoEnabled);
  if (issue) return { cards: [], usage: {}, issue };

  const random = mulberry32(seed);
  const usage: Record<string, number> = Object.fromEntries(artworks.map((item) => [item.id, 0]));
  const spanUsage: Record<string, SpanUsage> = Object.fromEntries(
    artworks.map((item) => [item.id, emptySpanUsage()]),
  );
  const cards: Card[] = [];
  let previousBentoColumn: number | undefined;

  for (let sheetStart = 0; sheetStart < cardCount; sheetStart += 2) {
    const sheetUsed = new Set<string>();
    for (let offset = 0; offset < 2 && sheetStart + offset < cardCount; offset += 1) {
      const cardIndex = sheetStart + offset;
      const specs = bentoSpecs(cardIndex, bentoEnabled);
      const placements = chooseBentoPlacements(specs, previousBentoColumn, random);
      if (placements.length) previousBentoColumn = placements[0].index % 9;
      const { artIndexes, coveredOwners } = generateArtMask(placements, random);
      const numberCells = generateNumberCells(artIndexes, random);
      const artOrigins = [...artIndexes].filter((index) => !coveredOwners.has(index));
      const placementByIndex = new Map(placements.map((placement) => [placement.index, placement]));
      const prioritizedPlacements = [...placements].sort((a, b) =>
        a.colSpan * a.rowSpan - b.colSpan * b.rowSpan
      );
      const orderedOrigins = [
        ...prioritizedPlacements.map((placement) => placement.index),
        ...shuffle(artOrigins.filter((index) => !placementByIndex.has(index)), random),
      ];
      const cellArtwork = new Map<number, string>();

      for (const cellIndex of orderedOrigins) {
        const placement = placementByIndex.get(cellIndex);
        const span = spanFor(placement);
        const available = shuffle(artworks, random)
          .filter((artwork) => !sheetUsed.has(artwork.id) && usage[artwork.id] < repeatCap);
        const oriented = placement
          ? available.filter((artwork) => matchesOrientation(artwork, placement))
          : available;
        const candidates = (oriented.length ? oriented : available)
          .sort((a, b) => {
            const spanDifference = spanUsage[a.id][span] - spanUsage[b.id][span];
            if (spanDifference) return spanDifference;
            const usageDifference = usage[a.id] - usage[b.id];
            if (usageDifference) return usageDifference;
            return placement ? aspectScore(a, placement) - aspectScore(b, placement) : 0;
          });
        const selected = candidates[0];
        if (!selected) {
          return {
            cards: [],
            usage,
            issue: capacityIssue(cardCount, artworks.length, repeatCap, bentoEnabled),
          };
        }
        cellArtwork.set(cellIndex, selected.id);
        sheetUsed.add(selected.id);
        usage[selected.id] += 1;
        spanUsage[selected.id][span] += 1;
      }

      const cells: Cell[] = numberCells.map((number, index) => {
        if (number !== null) return { kind: "number", number };
        const ownerIndex = coveredOwners.get(index);
        if (ownerIndex !== undefined) return { kind: "covered", ownerIndex };
        const cell: ArtCell = { kind: "art", artworkId: cellArtwork.get(index)! };
        const placement = placementByIndex.get(index);
        if (placement) {
          cell.colSpan = placement.colSpan;
          cell.rowSpan = placement.rowSpan;
        }
        return cell;
      });
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
