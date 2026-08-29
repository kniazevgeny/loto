import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const outDir = mkdtempSync(path.join(tmpdir(), "loto-game-ui-"));
const tsc = path.resolve("node_modules/.bin/tsc");
execFileSync(tsc, [
  "--ignoreConfig",
  "--target", "ES2022",
  "--module", "ESNext",
  "--moduleResolution", "Bundler",
  "--outDir", outDir,
  "src/game/pace.ts",
  "src/game/offline.ts",
], { stdio: "inherit" });

const pace = await import(pathToFileURL(path.join(outDir, "pace.js")).href);
const offline = await import(pathToFileURL(path.join(outDir, "offline.js")).href);

assert.equal(pace.sliderValueFromSeconds(12), 0);
assert.equal(pace.sliderValueFromSeconds(4), 8);
assert.equal(pace.sliderValueFromSeconds(3.5), 9);
assert.equal(pace.sliderValueFromSeconds(1), 14);
assert.equal(pace.secondsFromSliderValue(0), 12);
assert.equal(pace.secondsFromSliderValue(14), 1);
assert.equal(pace.speedometerNeedleAngle(12), -62);
assert.equal(pace.speedometerNeedleAngle(3), 62);
assert.equal(pace.speedometerNeedleAngle(1), 84);
assert.equal(pace.fasterSeconds(6), 5);
assert.equal(pace.fasterSeconds(4), 3.5);
assert.equal(pace.fasterSeconds(3), 2.5);
assert.equal(pace.fasterSeconds(1), 1);
assert.equal(pace.slowerSeconds(6), 7);
assert.equal(pace.slowerSeconds(3), 3.5);
assert.equal(pace.slowerSeconds(12), 12);
assert.equal(pace.formatSeconds(6, "ru"), "6");
assert.equal(pace.formatSeconds(6, "en"), "6");
assert.equal(pace.formatSeconds(3.6, "ru"), "3,6");
assert.equal(pace.formatSeconds(3.6, "fr"), "3,6");
assert.equal(pace.formatSeconds(3.6, "en"), "3.6");
assert.equal(pace.formatSeconds(3.5, "ru"), "3,5");
assert.equal(pace.formatSeconds(0.6, "ru"), "0,6");
assert.equal(pace.formatSeconds(12, "en"), "12");

const setupSource = readFileSync(new URL("../src/components/GameSetup.tsx", import.meta.url), "utf8");
const stageSource = readFileSync(new URL("../src/components/GameStage.tsx", import.meta.url), "utf8");
const pageSource = readFileSync(new URL("../src/components/GamePage.tsx", import.meta.url), "utf8");
const i18nSource = readFileSync(new URL("../src/i18n.ts", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
assert.match(setupSource, /game-interface-language/);
assert.match(setupSource, /<GameSpeedometer seconds=\{setup\.secondsPerToken\}/);
assert.match(setupSource, /formatSeconds\(setup\.secondsPerToken, language\)/);
assert.doesNotMatch(setupSource, /toFixed\(1\)/);
assert.match(css, /\.game-setup-primary\s*\{[^}]*grid-template-columns:\s*1fr/s);
assert.match(css, /\.game-setup\s*\{[^}]*width:\s*min\(100%,\s*460px\)/s);
assert.match(css, /\.game-setup-primary \.game-field \+ \.game-field\s*\{[^}]*border-top/s);
assert.match(css, /\.game-tags button\s*\{[^}]*display:\s*inline-flex[^}]*gap:\s*6px/s);
assert.match(css, /\.game-tags button\s*\{[^}]*font-size:\s*14px/s);
assert.doesNotMatch(css, /\.game-slider-row input\s*\{[^}]*accent-color/s);
assert.match(css, /\.game-slider-row input::-webkit-slider-runnable-track\s*\{[^}]*#6a665e/s);
assert.match(css, /\.game-slider-row input::-moz-range-track\s*\{[^}]*#6a665e/s);
assert.match(css, /\.game-slider-row input::-webkit-slider-thumb\s*\{[^}]*border:\s*3px solid #151514/s);
assert.match(css, /\.game-slider-row input::-moz-range-thumb\s*\{[^}]*border:\s*3px solid #151514/s);
assert.match(setupSource, /"--pace-fill":/);
assert.doesNotMatch(css, /#302f2b|#383631/);
assert.equal(css.match(/#403e39/g).length, 2);
assert.match(css, /\.game-token-summary\s*\{[^}]*padding-top:\s*20px/s);
assert.match(css, /\.game-tags button\s*\{[^}]*min-height:\s*44px/s);
assert.match(css, /\.game-slider-row\s*\{[^}]*grid-template-columns:\s*44px minmax\(0, 1fr\) 44px/s);
assert.match(css, /\.game-slider-row button\s*\{[^}]*width:\s*44px;\s*height:\s*44px/s);
assert.match(css, /\.game-slider-row button:first-of-type\s*\{[^}]*grid-area:\s*2 \/ 1/s);
assert.match(css, /\.game-slider-row input\s*\{[^}]*grid-area:\s*2 \/ 2/s);
assert.match(css, /\.game-token-summary\s*\{[^}]*font-size:\s*13px/s);
assert.match(css, /\.game-token-summary strong\s*\{[^}]*font-size:\s*20px/s);
assert.match(css, /\.game-slider-row \.game-speedometer\s*\{[^}]*width:\s*76px;\s*height:\s*48px/s);
assert.match(css, /\.game-start, \.game-quiet-button\s*\{[^}]*border-radius:\s*999px/s);
assert.match(css, /\.game-brand::before\s*\{[^}]*background-size:\s*5px 5px/s);
assert.match(css, /\.game-setup h1, \.game-complete h1\s*\{[^}]*font-size:\s*34px/s);
assert.match(css, /\.game-interface-language button\s*\{[^}]*width:\s*34px;\s*height:\s*30px/s);
assert.match(css, /\.game-interface-language button::before\s*\{[^}]*inset:\s*-7px -5px/s);
assert.match(css, /\.game-page\s*\{[^}]*color-scheme:\s*dark/s);
assert.doesNotMatch(setupSource, /Loto \+ Art/);
assert.doesNotMatch(stageSource, /Loto \+ Art/);
assert.doesNotMatch(css, /#5a5750|#555149/);
assert.equal(css.match(/#6a665e/g).length, 4);
assert.match(stageSource, /paused && <button className="game-end-button"/);
assert.match(stageSource, /requestFullscreen/);
assert.match(stageSource, /game\/\?set=default/);
assert.match(stageSource, /if \(paused\) setSpeedOpen\(false\)/);
assert.doesNotMatch(stageSource, /t\("remaining"\)/);
assert.match(stageSource, /game-stage-page\$\{paused \? " is-paused" : ""\}/);
assert.match(stageSource, /"--token-duration": `\$\{durationMs\}ms`/);
assert.match(stageSource, /onReady=\{\(\) => setReady\(true\)\}/);
assert.match(stageSource, /game-art-labels\$\{ready \? " is-ready" : ""\}/);
assert.match(stageSource, /className=\{`\$\{orientation\}\$\{loaded \? " is-ready" : ""\}`\}/);
assert.match(stageSource, /key=\{`number-\$\{token\.number\}`\}/);
assert.match(stageSource, /key=\{`number-labels-\$\{token\.number\}`\}/);
assert.match(pageSource, /durationMs=\{durationMs\}/);
assert.match(pageSource, /URLSearchParams\(window\.location\.search\)/, "The game route must read its set parameter");
assert.match(pageSource, /buildDefaultGameQueue\(artworks/, "The default set must use the complete built-in library without cards");
assert.match(i18nSource, /gameLanguagesHelp: "Выберите языки подписей для игры\."/);

const offlineUrls = offline.collectOfflineUrls({
  origin: "https://example.test",
  baseUrl: "/loto/",
  imageUrls: ["/loto/library/a.jpg", "/loto/library/a.jpg", "data:image/jpeg;base64,abc", "https://elsewhere.test/b.jpg"],
  shellUrls: ["/loto/assets/app.js"],
});
assert.deepEqual(offlineUrls, [
  "https://example.test/loto/",
  "https://example.test/loto/library/library.json",
  "https://example.test/loto/manifest.webmanifest",
  "https://example.test/loto/icons/icon.svg",
  "https://example.test/loto/icons/icon-192.png",
  "https://example.test/loto/icons/icon-512.png",
  "https://example.test/loto/icons/icon-maskable-512.png",
  "https://example.test/loto/icons/apple-touch-icon.png",
  "https://example.test/loto/assets/app.js",
  "https://example.test/loto/library/a.jpg",
]);

const progress = [];
const prepared = await offline.prepareOfflineResources(["a", "b", "c"], {
  store: async (url) => { if (url === "b") throw new Error("network"); },
}, (value) => progress.push(value));
assert.deepEqual(prepared, { state: "error", completed: 3, total: 3, failed: 1 });
assert.deepEqual(progress, [
  { completed: 0, total: 3 },
  { completed: 1, total: 3 },
  { completed: 2, total: 3 },
  { completed: 3, total: 3 },
]);

console.log("Game UI logic is valid.");
