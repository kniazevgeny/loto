import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildPrintedGameQueue } from "../src/game/printedSet.ts";
import { gameSource, localGameHref } from "../src/game/source.ts";
import type { Artwork } from "../src/types";

test("official links select the printed caller and unrecognized or ambiguous selectors never do", () => {
  for (const search of ["", "?set=default", "?utm_source=print"]) {
    assert.deepEqual(gameSource(search), { kind: "printed" });
  }
  for (const search of ["?set=", "?set=unknown", "?set=local", "?set=local&project=", "?project=other", "?set=default&project=other", "?set=default&set=local", "?set=local&project=A&project=B"]) {
    assert.deepEqual(gameSource(search), { kind: "missing" }, search);
  }
  const projectId = "custom + /&a=?";
  const href = new URL(localGameHref("/loto/", projectId), "https://example.test");
  assert.equal(href.pathname, "/loto/game/");
  assert.deepEqual(gameSource(href.search), { kind: "local", projectId });
});

test("caller matches the exact 75 artwork IDs and 88 numbers on the two archived editions", () => {
  const library: Artwork[] = JSON.parse(readFileSync(new URL("../app-public/library/library.json", import.meta.url), "utf8"));
  const artworks = new Map(library.map((artwork) => [artwork.id, artwork]));
  const queue = buildPrintedGameQueue(artworks);
  const ids = queue.flatMap((token) => token.kind === "art" ? [token.artwork.id] : []).sort();
  assert.equal(ids.length, 75);
  // Hash of sorted library IDs independently matched to the image bytes in both PDFs.
  assert.equal(createHash("sha256").update(ids.join("\n")).digest("hex"), "e3e589362a60140454e93388d9b4549439fd835ffc434f97d9231d7c16c3ac48");
  assert.deepEqual(queue.flatMap((token) => token.kind === "number" ? [token.number] : []),
    Array.from({ length: 90 }, (_, index) => index + 1).filter((number) => number !== 8 && number !== 47));
  artworks.delete(ids[0]);
  assert.deepEqual(buildPrintedGameQueue(artworks), []);
});