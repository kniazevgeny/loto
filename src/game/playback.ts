type Playback = {
  index: number;
  startedAt: number;
  elapsed: number;
  manualPause: boolean;
  storyOpen: boolean;
};

type PlaybackAction =
  | { type: "reset" | "reset-clock" | "pause" | "resume"; now: number }
  | { type: "close-story" }
  | { type: "open-story" | "move"; index: number; now: number }
  | { type: "advance"; scheduledFor: Playback; now: number };

export function initialPlayback(now: number): Playback {
  return { index: 0, startedAt: now, elapsed: 0, manualPause: false, storyOpen: false };
}

export function playbackPaused(state: Playback) {
  return state.manualPause || state.storyOpen;
}

export function updatePlayback(state: Playback, action: PlaybackAction): Playback {
  if (action.type === "close-story") {
    return state.storyOpen ? { ...state, storyOpen: false, manualPause: true } : state;
  }
  const { now } = action;
  switch (action.type) {
    case "reset":
      return initialPlayback(now);
    case "reset-clock":
    case "move":
      if (state.storyOpen) return state;
      return { ...state, index: action.type === "move" ? action.index : state.index, elapsed: 0, startedAt: now };
    case "advance":
      // A queued callback must not advance a turn that was paused, restarted, or moved.
      if (state !== action.scheduledFor || playbackPaused(state)) return state;
      return { ...state, index: state.index + 1, elapsed: 0, startedAt: now };
    case "pause":
      if (playbackPaused(state)) return state;
      return { ...state, manualPause: true, elapsed: state.elapsed + Math.max(0, now - state.startedAt) };
    case "open-story":
      if (state.storyOpen || action.index !== state.index) return state;
      return { ...state, storyOpen: true, elapsed: state.manualPause ? state.elapsed : state.elapsed + Math.max(0, now - state.startedAt) };
    case "resume":
      return playbackPaused(state) ? { ...state, storyOpen: false, manualPause: false, startedAt: now } : state;
  }
}