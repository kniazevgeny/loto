import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import path from "node:path";

const outDir = mkdtempSync(path.join(tmpdir(), "loto-generator-"));
const tsc = path.resolve("node_modules/.bin/tsc");
execFileSync(tsc, [
  "--ignoreConfig",
  "--target", "ES2022",
  "--module", "ESNext",
  "--moduleResolution", "Bundler",
  "--outDir", outDir,
  "src/generator.ts",
  "src/types.ts",
], { stdio: "inherit" });

const { generateCards } = await import(pathToFileURL(path.join(outDir, "generator.js")).href);
const artworks = Array.from({ length: 24 }, (_, index) => ({
  id: `art-${index}`,
  imageUrl: "",
  titles: { en: `Art ${index}` },
  author: "",
  year: "",
  aspectRatio: 1,
}));
const result = generateCards(24, artworks, 8, 42, true);
assert.equal(result.issue, undefined);

const spanUsage = Object.fromEntries(artworks.map((artwork) => [artwork.id, {
  "2x2": 0,
  "2x1": 0,
  "1x2": 0,
}]));
for (const card of result.cards) {
  for (const cell of card.cells) {
    if (cell.kind === "art") {
      const span = `${cell.colSpan ?? 1}x${cell.rowSpan ?? 1}`;
      if (span in spanUsage[cell.artworkId]) {
        spanUsage[cell.artworkId][span] += 1;
      }
    }
  }
}

for (const span of ["2x2", "2x1", "1x2"]) {
  const counts = Object.values(spanUsage).map((usage) => usage[span]);
  assert.ok(
    Math.max(...counts) - Math.min(...counts) <= 1,
    `${span} use must stay balanced; received ${JSON.stringify(spanUsage)}`,
  );
}

console.log("Bento artwork spans are balanced.");
