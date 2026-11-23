import { useEffect, useMemo, useReducer, useState } from "react";
import { loadProject } from "../db";
import { artStories } from "../game/artStories";
import { initialPlayback, playbackPaused, updatePlayback } from "../game/playback";
import { buildGameQueue, shuffle, summarizeGameTokens } from "../game/queue";
import { buildPrintedGameQueue } from "../game/printedSet";
import { gameSource } from "../game/source";
import { collectOfflineUrls, prepareBrowserOfflineGame, type OfflinePreparation } from "../game/offline";
import { browserFullscreenHost, browserWakeLockHost, enterFullscreen, exitFullscreen, keepScreenAwake } from "../game/screen";
import { remainingFraction, tokenDurationMs } from "../game/timing";
import type { GameSetup as GameSetupValues, GameToken } from "../game/types";
import { tr, type MessageKey } from "../i18n";
import { loadBuiltinLibrary } from "../library";
import type { Artwork, Project } from "../types";
import { GameSetup } from "./GameSetup";
import { GameStage } from "./GameStage";

function defaultSetup(language: string): GameSetupValues {
  return {
    languages: [language],
    secondsPerToken: 6,
    includeAllNumbers: false,
  };
}

export function GamePage() {
  const source = useMemo(() => gameSource(window.location.search), []);
  const gameHref = `${import.meta.env.BASE_URL}game/${window.location.search}`;
  const [project, setProject] = useState<Project | null>(null);
  const [builtin, setBuiltin] = useState<Artwork[]>([]);
  const [setup, setSetup] = useState<GameSetupValues | null>(null);
  const [queue, setQueue] = useState<GameToken[]>([]);
  const [playback, dispatchPlayback] = useReducer(updatePlayback, undefined, () => initialPlayback(Date.now()));
  const [now, setNow] = useState(Date.now());
  const [playing, setPlaying] = useState(false);
  const [interfaceLanguage, setInterfaceLanguage] = useState("en");
  const [offline, setOffline] = useState<OfflinePreparation>({ state: "idle", completed: 0, total: 0, failed: 0 });
  const [endedByWinner, setEndedByWinner] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (source.kind === "missing") return;
    let active = true;
    Promise.all([
      loadBuiltinLibrary(),
      source.kind === "local" ? loadProject(source.projectId) : undefined,
    ])
      .then(([library, saved]) => {
        if (!active) return;
        if (source.kind === "local" && !saved) { setError(true); return; }
        const language = saved?.language === "fr" || saved?.language === "ru" ? saved.language : "en";
        setProject(saved ?? null);
        setInterfaceLanguage(language);
        setBuiltin(library);
        setSetup(defaultSetup(language));
      })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [source]);

  useEffect(() => {
    document.documentElement.lang = interfaceLanguage;
  }, [interfaceLanguage]);

  const artworkMap = useMemo(() => new Map([...builtin, ...(project?.customArtworks ?? [])].map((artwork) => [artwork.id, artwork])), [builtin, project]);
  const usedQueue = useMemo(() => {
    if (source.kind === "printed") return buildPrintedGameQueue(artworkMap);
    return project ? buildGameQueue(project, artworkMap, false, () => 0) : [];
  }, [source, project, artworkMap]);
  const summary = useMemo(() => summarizeGameTokens(usedQueue), [usedQueue]);
  const includeAllNumbers = setup?.includeAllNumbers;
  const previewQueue = useMemo(() => project && includeAllNumbers ? buildGameQueue(project, artworkMap, true, () => 0) : usedQueue, [artworkMap, project, includeAllNumbers, usedQueue]);
  const t = (key: MessageKey) => tr(interfaceLanguage, key);

  useEffect(() => {
    if (!usedQueue.length) return;
    const shellUrls = Array.from(document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>("script[src], link[rel='stylesheet'][href]"))
      .map((element) => element instanceof HTMLScriptElement ? element.src : element.href);
    const imageUrls = usedQueue.flatMap((token) => token.kind === "art" ? [token.artwork.imageUrl] : []);
    const urls = collectOfflineUrls({ origin: window.location.origin, baseUrl: import.meta.env.BASE_URL, imageUrls, shellUrls });
    let active = true;
    setOffline({ state: "preparing", completed: 0, total: urls.length, failed: 0 });
    prepareBrowserOfflineGame(
      urls,
      `${import.meta.env.BASE_URL}sw.js`,
      import.meta.env.BASE_URL,
      ({ completed, total }) => active && setOffline({ state: "preparing", completed, total, failed: 0 }),
      import.meta.env.PROD,
    ).then((result) => active && setOffline(result));
    return () => { active = false; };
  }, [usedQueue]);

  const startGame = () => {
    if (!setup || !usedQueue.length) return;
    setQueue(shuffle(previewQueue));
    const startedAt = Date.now();
    dispatchPlayback({ type: "reset", now: startedAt });
    setNow(startedAt);
    setPlaying(true);
    setEndedByWinner(false);
    void enterFullscreen(browserFullscreenHost());
  };

  useEffect(() => {
    if (!playing) return;
    return keepScreenAwake(browserWakeLockHost());
  }, [playing]);

  const activeIndex = playback.index;
  const token = queue[activeIndex];
  const story = token?.kind === "art" && builtin.includes(token.artwork) ? artStories.get(token.artwork.id) : undefined;
  const paused = playbackPaused(playback);
  const clockRunning = playing && !endedByWinner && !paused && activeIndex < queue.length;
  const durationMs = setup && token ? tokenDurationMs(token, setup.secondsPerToken * 1000) : 0;
  const elapsedMs = playback.elapsed + (clockRunning ? Math.max(0, now - playback.startedAt) : 0);
  const countdownProgress = remainingFraction(elapsedMs, durationMs);

  useEffect(() => {
    if (!clockRunning) return;
    const remainingMs = Math.max(0, durationMs - playback.elapsed - Math.max(0, Date.now() - playback.startedAt));
    const timer = window.setTimeout(() => {
      dispatchPlayback({ type: "advance", scheduledFor: playback, now: Date.now() });
    }, remainingMs);
    return () => window.clearTimeout(timer);
  }, [clockRunning, durationMs, playback]);

  useEffect(() => {
    if (!clockRunning) return;
    const frame = window.requestAnimationFrame(() => setNow(Date.now()));
    return () => window.cancelAnimationFrame(frame);
  }, [clockRunning, now, playback]);

  const moveTo = (nextIndex: number) => {
    dispatchPlayback({ type: "move", index: Math.max(0, Math.min(queue.length, nextIndex)), now: Date.now() });
  };

  if (source.kind === "missing" || error || (source.kind === "printed" && setup && !summary.total)) {
    return <main className="game-page game-loading" role="status">{t(source.kind === "local" ? "gameLocalUnavailable" : "gameSetUnavailable")}</main>;
  }
  if (!setup) return <main className="game-page game-loading">{t("loading")}</main>;

  if (!playing) {
    return <GameSetup
      setup={setup}
      summary={summary}
      previewQueue={previewQueue}
      gameHref={gameHref}
      allowExtraNumbers={source.kind === "local"}
      language={interfaceLanguage}
      interfaceLanguage={interfaceLanguage}
      offline={offline}
      t={t}
      onChange={(patch) => setSetup((current) => current ? { ...current, ...patch } : current)}
      onInterfaceLanguageChange={setInterfaceLanguage}
      onStart={startGame}
    />;
  }

  return <GameStage
    gameHref={gameHref}
    queue={queue}
    activeIndex={activeIndex}
    languages={setup.languages}
    paused={paused}
    countdownProgress={countdownProgress}
    secondsPerToken={setup.secondsPerToken}
    durationMs={durationMs}
    endedByWinner={endedByWinner}
    interfaceLanguage={interfaceLanguage}
    story={story}
    storyOpen={playback.storyOpen}
    t={t}
    onPrevious={() => moveTo(activeIndex - 1)}
    onNext={() => moveTo(activeIndex + 1)}
    onPause={() => dispatchPlayback({ type: "pause", now: Date.now() })}
    onResume={() => dispatchPlayback({ type: "resume", now: Date.now() })}
    onOpenStory={() => { if (story) dispatchPlayback({ type: "open-story", index: activeIndex, now: Date.now() }); }}
    onCloseStory={() => dispatchPlayback({ type: "close-story" })}
    onRestart={startGame}
    onBackToSetup={() => { setPlaying(false); void exitFullscreen(browserFullscreenHost()); }}
    onEndGame={() => setEndedByWinner(true)}
    onSpeedChange={(secondsPerToken) => { setSetup((current) => current ? { ...current, secondsPerToken } : current); dispatchPlayback({ type: "reset-clock", now: Date.now() }); }}
  />;
}
