import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const outDir = mkdtempSync(path.join(tmpdir(), "loto-game-"));
const tsc = path.resolve("node_modules/.bin/tsc");
execFileSync(tsc, [
  "--ignoreConfig",
  "--target", "ES2022",
  "--module", "ESNext",
  "--moduleResolution", "Bundler",
  "--outDir", outDir,
  "src/game/queue.ts",
  "src/game/timing.ts",
  "src/game/media.ts",
  "src/game/types.ts",
  "src/types.ts",
], { stdio: "inherit" });

const { buildDefaultGameQueue, buildGameQueue, estimateGameDuration, formatDuration, summarizeGameTokens } = await import(pathToFileURL(path.join(outDir, "game", "queue.js")).href);
const { remainingFraction, tokenDurationMs, estimateQueueDuration } = await import(pathToFileURL(path.join(outDir, "game", "timing.js")).href);
const { orientationFromDimensions } = await import(pathToFileURL(path.join(outDir, "game", "media.js")).href);

const artworks = new Map([
  ["art-a", { id: "art-a", imageUrl: "", titles: { en: "A" }, author: "", year: "", license: "Public Domain" }],
  ["art-b", { id: "art-b", imageUrl: "", titles: { en: "B" }, author: "", year: "", license: "Public Domain" }],
  ["unused", { id: "unused", imageUrl: "", titles: { en: "Unused" }, author: "", year: "", license: "Public Domain" }],
]);

const project = {
  cards: [{
    id: "card-1",
    cells: [
      { kind: "number", number: 1 },
      { kind: "number", number: 42 },
      { kind: "number", number: 1 },
      { kind: "art", artworkId: "art-a" },
      { kind: "art", artworkId: "art-b" },
      { kind: "covered", ownerIndex: 3, artworkId: "art-a" },
    ],
  }],
};

const identity = () => 0;
assert.equal(typeof buildDefaultGameQueue, "function", "The game must expose a card-independent built-in queue");
const defaultQueue = buildDefaultGameQueue([...artworks.values()], identity);
const usedQueue = buildGameQueue(project, artworks, false, identity);
const allNumberQueue = buildGameQueue(project, artworks, true, identity);

assert.deepEqual(
  new Set(usedQueue.filter((item) => item.kind === "number").map((item) => item.number)),
  new Set([1, 42]),
);
assert.deepEqual(
  new Set(usedQueue.filter((item) => item.kind === "art").map((item) => item.artwork.id)),
  new Set(["art-a", "art-b"]),
);
assert.equal(usedQueue.length, 4);
assert.equal(allNumberQueue.filter((item) => item.kind === "number").length, 90);
assert.equal(allNumberQueue.filter((item) => item.kind === "art").length, 2);
assert.equal(defaultQueue.filter((item) => item.kind === "number").length, 90);
assert.deepEqual(
  new Set(defaultQueue.filter((item) => item.kind === "art").map((item) => item.artwork.id)),
  new Set(["art-a", "art-b", "unused"]),
);
assert.equal(estimateGameDuration(12, 6), 72);
assert.deepEqual(summarizeGameTokens(usedQueue), { artworks: 2, numbers: 2, total: 4, allNumberTotal: 92 });
assert.equal(remainingFraction(0, 6000), 1);
assert.equal(remainingFraction(1500, 6000), .75);
assert.equal(remainingFraction(9000, 6000), 0);
assert.equal(tokenDurationMs({ kind: "art", artwork: artworks.get("art-a") }, 6000), 6000);
assert.equal(tokenDurationMs({ kind: "number", number: 11 }, 6000), 3600);
assert.equal(estimateQueueDuration(usedQueue, 6000), 19200);
assert.equal(formatDuration(774, "en"), "13 min");
assert.equal(formatDuration(1, "ru"), "1 мин");
assert.equal(orientationFromDimensions(960, 974), "portrait");
assert.equal(orientationFromDimensions(960, 947), "square");
assert.equal(orientationFromDimensions(1600, 900), "landscape");
assert.equal(orientationFromDimensions(2400, 800), "panoramic");
assert.equal(orientationFromDimensions(800, 800), "square");

console.log("Game queue logic is valid.");
