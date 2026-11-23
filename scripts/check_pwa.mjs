import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const manifestPath = new URL("../app-public/manifest.webmanifest", import.meta.url);
assert.ok(existsSync(manifestPath), "PWA manifest should exist");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
assert.equal(manifest.name, "Loto + Art");
assert.equal(manifest.short_name, "Loto + Art");
assert.equal(manifest.id, "/loto/game/");
assert.equal(manifest.start_url, "/loto/game/?set=default");
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

const root = "https://example.test/loto/";
const entry = { method: "GET", mode: "navigate", url: `${root}game/?set=default` };
const cached = new Map([[root, new Response("cached root")], [entry.url, new Response("old shell")]]);
let network = () => new Response("new shell");
let failCacheWrite = false;
let handleFetch;
runInNewContext(swSource, {
  URL,
  self: {
    location: new URL(root),
    registration: { scope: root },
    addEventListener: (name, handler) => { if (name === "fetch") handleFetch = handler; },
  },
  fetch: (_, options) => {
    assert.equal(options.cache, "no-cache");
    return network();
  },
  caches: {
    match: (request) => cached.get(request.url ?? request)?.clone(),
    open: () => ({ put: (request, response) => {
      if (failCacheWrite) throw new Error("cache full");
      cached.set(request.url, response);
    } }),
  },
});
const requestPage = (request = entry) => new Promise((resolve) => handleFetch({ request, respondWith: resolve }));
assert.equal(await (await requestPage()).text(), "new shell");
network = () => new Response("missing", { status: 404 });
assert.equal((await requestPage()).status, 404);
failCacheWrite = true;
network = () => new Response("newer shell");
assert.equal(await (await requestPage()).text(), "newer shell");
network = () => { throw new Error("offline"); };
assert.equal(await (await requestPage()).text(), "new shell");
assert.equal(await (await requestPage({ ...entry, url: `${root}game/?set=custom` })).text(), "cached root");
cached.delete(root);
await assert.rejects(requestPage({ ...entry, url: `${root}game/?set=custom` }), /offline/);
const library = { method: "GET", mode: "cors", url: `${root}library/library.json` };
cached.set(root, new Response("cached root"));
await assert.rejects(requestPage(library), /offline/, "metadata must not fall back to the HTML shell");
failCacheWrite = false;
cached.set(library.url, new Response("old metadata"));
network = () => new Response("new metadata");
assert.equal(await (await requestPage(library)).text(), "new metadata");
network = () => { throw new Error("offline"); };
assert.equal(await (await requestPage(library)).text(), "new metadata");

console.log("PWA checks passed");
