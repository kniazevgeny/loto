export const OFFLINE_CACHE_NAME = "loto-art-offline-v2";

const PWA_SHELL_PATHS = [
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
];

export type OfflinePreparation = {
  state: "idle" | "preparing" | "ready" | "unsupported" | "error";
  completed: number;
  total: number;
  failed: number;
};

export function collectOfflineUrls({
  origin, baseUrl, imageUrls, shellUrls,
}: {
  origin: string;
  baseUrl: string;
  imageUrls: string[];
  shellUrls: string[];
}) {
  const base = new URL(baseUrl, origin);
  const candidates = [
    base.href,
    new URL("library/library.json", base).href,
    ...PWA_SHELL_PATHS.map((path) => new URL(path, base).href),
    ...shellUrls,
    ...imageUrls,
  ];
  const unique = new Set<string>();

  for (const candidate of candidates) {
    if (!candidate || candidate.startsWith("data:") || candidate.startsWith("blob:")) continue;
    const url = new URL(candidate, origin);
    if (url.origin === origin) unique.add(url.href);
  }

  return [...unique];
}

export async function prepareOfflineResources(
  urls: string[],
  adapter: { store: (url: string) => Promise<void> },
  onProgress: (progress: { completed: number; total: number }) => void,
): Promise<OfflinePreparation> {
  let failed = 0;
  onProgress({ completed: 0, total: urls.length });

  for (let index = 0; index < urls.length; index += 1) {
    try {
      await adapter.store(urls[index]);
    } catch {
      failed += 1;
    }
    onProgress({ completed: index + 1, total: urls.length });
  }

  return {
    state: failed ? "error" : "ready",
    completed: urls.length,
    total: urls.length,
    failed,
  };
}

export async function prepareBrowserOfflineGame(
  urls: string[],
  serviceWorkerUrl: string,
  scope: string,
  onProgress: (progress: { completed: number; total: number }) => void,
  enabled = true,
): Promise<OfflinePreparation> {
  if (!enabled || typeof navigator === "undefined" || !("serviceWorker" in navigator) || typeof caches === "undefined") {
    return { state: "unsupported", completed: 0, total: urls.length, failed: 0 };
  }

  try {
    await navigator.serviceWorker.register(serviceWorkerUrl, { scope });
    await navigator.serviceWorker.ready;
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    return await prepareOfflineResources(urls, {
      store: async (url) => {
        if (await cache.match(url)) return;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Unable to cache ${url}: ${response.status}`);
        await cache.put(url, response);
      },
    }, onProgress);
  } catch {
    return { state: "error", completed: 0, total: urls.length, failed: urls.length };
  }
}
