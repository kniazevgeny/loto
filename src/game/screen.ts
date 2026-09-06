export type FullscreenHost = {
  isFullscreen: () => boolean;
  request: () => Promise<void>;
  exit: () => Promise<void>;
};

export type WakeLockSentinelLike = { release: () => Promise<void> };
export type WakeLockHost = {
  request?: () => Promise<WakeLockSentinelLike>;
  isVisible: () => boolean;
  watchVisibility: (listener: () => void) => () => void;
};

export function browserFullscreenHost(): FullscreenHost {
  return {
    isFullscreen: () => Boolean(document.fullscreenElement),
    request: () => document.documentElement.requestFullscreen({ navigationUI: "hide" }),
    exit: () => document.exitFullscreen(),
  };
}

export function browserWakeLockHost(): WakeLockHost {
  const api = (navigator as unknown as { wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> } }).wakeLock;
  return {
    request: api ? () => api.request("screen") : undefined,
    isVisible: () => document.visibilityState === "visible",
    watchVisibility: (listener) => {
      document.addEventListener("visibilitychange", listener);
      return () => document.removeEventListener("visibilitychange", listener);
    },
  };
}

// Safari on iPhone exposes no element fullscreen at all, and every browser
// rejects the request when it arrives outside a user gesture. Neither is worth
// interrupting the game for, so both resolve quietly.
export async function enterFullscreen(host: FullscreenHost) {
  if (host.isFullscreen()) return false;
  try {
    await host.request();
    return true;
  } catch {
    return false;
  }
}

export async function exitFullscreen(host: FullscreenHost) {
  if (!host.isFullscreen()) return false;
  try {
    await host.exit();
    return true;
  } catch {
    return false;
  }
}

// The browser drops a screen wake lock whenever the page is hidden — switching
// tabs or locking the phone — and never restores it, so a lock held across a
// long game has to be reacquired every time the page becomes visible again.
export function keepScreenAwake(host: WakeLockHost) {
  const request = host.request;
  if (!request) return () => {};
  let sentinel: WakeLockSentinelLike | null = null;
  let active = true;

  const acquire = async () => {
    if (!active || sentinel || !host.isVisible()) return;
    try {
      const next = await request();
      if (!active) {
        void next.release();
        return;
      }
      sentinel = next;
    } catch {
      sentinel = null;
    }
  };

  const stopWatching = host.watchVisibility(() => {
    if (host.isVisible()) void acquire();
    else sentinel = null;
  });
  void acquire();

  return () => {
    active = false;
    stopWatching();
    void sentinel?.release();
    sentinel = null;
  };
}
