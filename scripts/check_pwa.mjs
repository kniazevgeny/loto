import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const manifestPath = new URL("../app-public/manifest.webmanifest", import.meta.url);
assert.ok(existsSync(manifestPath), "PWA manifest should exist");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
assert.equal(manifest.name, "Loto + Art");
assert.equal(manifest.short_name, "Loto + Art");
assert.equal(manifest.start_url, "/loto/game?set=default");
assert.equal(manifest.scope, "/loto/");
assert.equal(manifest.display, "standalone");
assert.equal(manifest.theme_color, "#151514");
assert.equal(manifest.background_color, "#151514");
assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192" && icon.purpose.includes("any")));
assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose.includes("maskable")));

for (const icon of ["icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"]) {
  assert.ok(existsSync(new URL(`../app-public/icons/${icon}`, import.meta.url)), `${icon} should exist`);
}

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(html, /rel="manifest" href="%BASE_URL%manifest\.webmanifest"/);
assert.match(html, /rel="apple-touch-icon" href="%BASE_URL%icons\/apple-touch-icon\.png"/);

const iconSource = readFileSync(new URL("../app-public/icons/icon.svg", import.meta.url), "utf8");
assert.match(iconSource, /DIN Condensed/);
assert.match(iconSource, /font-size="140"/);
assert.match(iconSource, /font-size="116"/);
assert.match(iconSource, /id="starry"/);
assert.match(iconSource, /id="wave"/);

const offlineSource = readFileSync(new URL("../src/game/offline.ts", import.meta.url), "utf8");
const swSource = readFileSync(new URL("../app-public/sw.js", import.meta.url), "utf8");
assert.match(offlineSource, /loto-art-offline-v2/);
assert.match(swSource, /loto-art-offline-v2/);
assert.match(offlineSource, /manifest\.webmanifest/);
assert.match(offlineSource, /icon-192\.png/);

console.log("PWA checks passed");
