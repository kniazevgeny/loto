import { useEffect, useMemo, useState } from "react";
import { createDefaultProject, defaultDesign } from "../defaults";
import { loadLatestProject } from "../db";
import { buildGameQueue, summarizeGameTokens } from "../game/queue";
import { collectOfflineUrls, prepareBrowserOfflineGame, type OfflinePreparation } from "../game/offline";
import { estimateQueueDuration, remainingFraction, tokenDurationMs } from "../game/timing";
import type { GameSetup as GameSetupValues, GameToken } from "../game/types";
import { tr, type MessageKey } from "../i18n";
import { loadBuiltinLibrary } from "../library";
import type { Artwork, Project } from "../types";
import { GameSetup } from "./GameSetup";
import { GameStage } from "./GameStage";

function defaultSetup(project: Project): GameSetupValues {
  return {
    languages: [project.language === "fr" || project.language === "ru" ? project.language : "en"],
    secondsPerToken: 6,
    includeAllNumbers: false,
  };
}

export function GamePage() {
  const [project, setProject] = useState<Project | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [setup, setSetup] = useState<GameSetupValues | null>(null);
  const [queue, setQueue] = useState<GameToken[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [elapsedBeforePause, setElapsedBeforePause] = useState(0);
  const [tokenStartedAt, setTokenStartedAt] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [playing, setPlaying] = useState(false);
  const [interfaceLanguage, setInterfaceLanguage] = useState("en");
  const [offline, setOffline] = useState<OfflinePreparation>({ state: "idle", completed: 0, total: 0, failed: 0 });
  const [endedByWinner, setEndedByWinner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadBuiltinLibrary(), loadLatestProject()])
      .then(([builtin, saved]) => {
        const next = saved || createDefaultProject();
        next.design = { ...defaultDesign, ...next.design };
        next.bentoEnabled ??= true;
        setProject(next);
        setInterfaceLanguage(next.language === "fr" || next.language === "ru" ? next.language : "en");
        setArtworks([...builtin, ...next.customArtworks]);
        setSetup(defaultSetup(next));
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : String(reason)));
  }, []);

  useEffect(() => {
    document.documentElement.lang = interfaceLanguage;
  }, [interfaceLanguage]);

  const artworkMap = useMemo(() => new Map(artworks.map((artwork) => [artwork.id, artwork])), [artworks]);
  const usedQueue = useMemo(() => project ? buildGameQueue(project, artworkMap, false, () => 0) : [], [project, artworkMap]);
  const summary = useMemo(() => summarizeGameTokens(usedQueue), [usedQueue]);
  const previewQueue = useMemo(() => project && setup ? buildGameQueue(project, artworkMap, setup.includeAllNumbers, () => 0) : [], [artworkMap, project, setup]);
  const t = (key: MessageKey) => tr(interfaceLanguage, key);

  useEffect(() => {
    if (!project) return;
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
  }, [project, usedQueue]);

  const startGame = () => {
    if (!project || !setup) return;
    setQueue(buildGameQueue(project, artworkMap, setup.includeAllNumbers));
    setActiveIndex(0);
    setPaused(false);
    setElapsedBeforePause(0);
    setTokenStartedAt(Date.now());
    setNow(Date.now());
    setPlaying(true);
    setEndedByWinner(false);
  };

  const durationMs = setup && queue[activeIndex] ? tokenDurationMs(queue[activeIndex], setup.secondsPerToken * 1000) : 0;
  const elapsedMs = elapsedBeforePause + (playing && !paused ? Math.max(0, now - tokenStartedAt) : 0);
  const countdownProgress = remainingFraction(elapsedMs, durationMs);

  useEffect(() => {
    if (!playing || paused || !setup || activeIndex >= queue.length) return;
    const remainingMs = Math.max(0, durationMs - elapsedBeforePause);
    const timer = window.setTimeout(() => {
      setActiveIndex((index) => index + 1);
      setElapsedBeforePause(0);
      setTokenStartedAt(Date.now());
    }, remainingMs);
    return () => window.clearTimeout(timer);
  }, [activeIndex, durationMs, elapsedBeforePause, paused, playing, queue.length, setup]);

  useEffect(() => {
    if (!playing || paused || activeIndex >= queue.length) return;
    const frame = window.requestAnimationFrame(() => setNow(Date.now()));
    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, now, paused, playing, queue.length]);

  const moveTo = (nextIndex: number) => {
    setActiveIndex(Math.max(0, Math.min(queue.length, nextIndex)));
    setElapsedBeforePause(0);
    setTokenStartedAt(Date.now());
    setNow(Date.now());
  };

  const togglePause = () => {
    if (paused) {
      setTokenStartedAt(Date.now());
      setNow(Date.now());
      setPaused(false);
      return;
    }
    setElapsedBeforePause((current) => current + Math.max(0, Date.now() - tokenStartedAt));
    setPaused(true);
  };

  if (error) return <main className="game-page game-loading">{error}</main>;
  if (!project || !setup) return <main className="game-page game-loading">{t("loading")}</main>;

  if (!playing) {
    return <GameSetup
      setup={setup}
      summary={summary}
      previewQueue={previewQueue}
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
    queue={queue}
    activeIndex={activeIndex}
    languages={setup.languages}
    paused={paused}
    countdownProgress={countdownProgress}
    secondsPerToken={setup.secondsPerToken}
    durationMs={durationMs}
    endedByWinner={endedByWinner}
    t={t}
    onPrevious={() => moveTo(activeIndex - 1)}
    onNext={() => moveTo(activeIndex + 1)}
    onTogglePause={togglePause}
    onRestart={startGame}
    onBackToSetup={() => { setPlaying(false); setPaused(false); moveTo(0); }}
    onEndGame={() => { setPaused(true); setEndedByWinner(true); }}
    onSpeedChange={(secondsPerToken) => { setSetup((current) => current ? { ...current, secondsPerToken } : current); setElapsedBeforePause(0); setTokenStartedAt(Date.now()); setNow(Date.now()); }}
  />;
}
