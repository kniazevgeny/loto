import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { artStories } from "../src/game/artStories.ts";
import { artworkDetailCrop } from "../src/game/media.ts";
import { initialPlayback, playbackPaused, updatePlayback } from "../src/game/playback.ts";

test("a story suspends the current turn and invalidates queued advancement", () => {
  const running = initialPlayback(1000);
  const staleTimer = { type: "advance", scheduledFor: running, now: 7000 } as const;
  const reading = updatePlayback(running, { type: "open-story", index: 0, now: 6999 });
  assert.ok(playbackPaused(reading));
  assert.equal(reading.elapsed, 5999);
  assert.equal(updatePlayback(reading, staleTimer), reading);
  assert.equal(updatePlayback(reading, { type: "move", index: 1, now: 7001 }), reading);
  assert.equal(updatePlayback(reading, { type: "pause", now: 7001 }), reading);
  const resumed = updatePlayback(reading, { type: "resume", now: 20000 });
  assert.equal(playbackPaused(resumed), false);
  assert.equal(resumed.elapsed, 5999);
  assert.equal(resumed.startedAt, 20000);
  assert.equal(updatePlayback(resumed, staleTimer), resumed);
  const next = updatePlayback(resumed, { type: "advance", scheduledFor: resumed, now: 20001 });
  assert.equal(next.index, 1);
  assert.equal(updatePlayback(next, { type: "open-story", index: 0, now: 20002 }), next);
});

test("only explicit Resume restarts a paused turn", () => {
  const running = initialPlayback(1000);
  const manual = updatePlayback(running, { type: "pause", now: 2500 });
  assert.equal(updatePlayback(manual, { type: "pause", now: 3000 }), manual);
  assert.ok(playbackPaused(updatePlayback(manual, { type: "move", index: 1, now: 3500 })));
  for (const state of [manual, running]) {
    const reading = updatePlayback(state, { type: "open-story", index: 0, now: 2500 });
    const closed = updatePlayback(reading, { type: "close-story" });
    assert.ok(playbackPaused(closed));
    assert.equal(closed.elapsed, 1500);
    for (const paused of [manual, reading, closed]) {
      const resumed = updatePlayback(paused, { type: "resume", now: 10000 });
      assert.equal(playbackPaused(resumed), false);
      assert.equal(resumed.storyOpen, false);
      assert.equal(resumed.elapsed, 1500);
    }
  }
});

test("the ordinary timer still advances an unpaused turn without a story", () => {
  const running = initialPlayback(1000);
  const next = updatePlayback(running, { type: "advance", scheduledFor: running, now: 4600 });
  assert.deepEqual(next, { ...initialPlayback(4600), index: 1 });
});

test("the loupe centers on an interior point and keeps a square inside the original at the edges", () => {
  assert.deepEqual(artworkDetailCrop(960, 1200, 50, 50), { left: 280, top: 400, size: 400 });
  assert.deepEqual(artworkDetailCrop(960, 1200, 0, 100), { left: 0, top: 800, size: 400 });
  assert.deepEqual(artworkDetailCrop(1200, 960, 100, 0), { left: 800, top: 0, size: 400 });
});

test("stories are sparse, sourced, and have copy in all three game languages", () => {
  const library = JSON.parse(readFileSync(new URL("../app-public/library/library.json", import.meta.url), "utf8"));
  assert.ok(artStories.size > 0 && artStories.size < library.length);
  for (const [id, story] of artStories) {
    const artwork = library.find((item: { id: string }) => item.id === id);
    assert.equal(artwork?.category, "painting", id);
    assert.ok(existsSync(new URL(artwork.imageUrl, new URL("../app-public/", import.meta.url))), id);
    assert.equal(new URL(story.url).protocol, "https:");
    assert.ok(story.museum);
    for (const language of ["en", "fr", "ru"] as const) {
      assert.ok(story.copy[language].headline && story.copy[language].fact, `${id}: ${language}`);
    }
    assert.ok(story.spots.length >= 2, id);
    for (const { x, y, copy, url } of story.spots) {
      assert.ok(x > 0 && x < 100 && y > 0 && y < 100, id);
      assert.equal(new URL(url ?? story.url).protocol, "https:");
      for (const language of ["en", "fr", "ru"] as const) assert.ok(copy[language].headline && copy[language].fact, `${id}: ${language}`);
    }
  }
});