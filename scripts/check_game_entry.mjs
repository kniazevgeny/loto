import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const rootEntry = new URL("../dist/index.html", import.meta.url);
const gameEntry = new URL("../dist/game/index.html", import.meta.url);

assert.ok(existsSync(rootEntry), "Build the app before checking its game entry");
assert.ok(existsSync(gameEntry), "The production build must include dist/game/index.html");
assert.equal(
  readFileSync(gameEntry, "utf8"),
  readFileSync(rootEntry, "utf8"),
  "The game entry must use the same generated app shell as the editor",
);

const manifest = JSON.parse(readFileSync(new URL("../app-public/manifest.webmanifest", import.meta.url), "utf8"));
assert.equal(manifest.id, "/loto/game/");
assert.equal(manifest.start_url, "/loto/game/?set=default");

console.log("Game deployment entry is valid.");
