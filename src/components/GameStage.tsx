import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Minus, Pause, Play, Plus, RotateCcw, Settings } from "lucide-react";
import { storyLocale, type ArtStory } from "../game/artStories";
import { numberNickname } from "../game/numberNicknames";
import { orientationFromDimensions, type MediaOrientation } from "../game/media";
import { fasterSeconds, MAX_PACE_SLIDER_VALUE, secondsFromSliderValue, sliderValueFromSeconds, slowerSeconds } from "../game/pace";
import type { GameToken } from "../game/types";
import type { MessageKey } from "../i18n";
import type { Artwork } from "../types";
import { GameArtStory, storyOriginFrom, type StoryOrigin } from "./GameArtStory";
import { GameSpeedometer } from "./GameSpeedometer";
import { titleFor } from "./LotoViews";

type Translate = (key: MessageKey) => string;

export function GameStage({
  gameHref, queue, activeIndex, languages, paused, countdownProgress, secondsPerToken, durationMs, endedByWinner, interfaceLanguage, story, storyOpen, t, onPrevious, onNext, onPause, onResume, onOpenStory, onCloseStory, onRestart, onBackToSetup, onEndGame, onSpeedChange,
}: {
  gameHref: string;
  queue: GameToken[];
  activeIndex: number;
  languages: string[];
  paused: boolean;
  countdownProgress: number;
  secondsPerToken: number;
  durationMs: number;
  endedByWinner: boolean;
  interfaceLanguage: string;
  story?: ArtStory;
  storyOpen: boolean;
  t: Translate;
  onPrevious: () => void;
  onNext: () => void;
  onPause: () => void;
  onResume: () => void;
  onOpenStory: () => void;
  onCloseStory: () => void;
  onRestart: () => void;
  onBackToSetup: () => void;
  onEndGame: () => void;
  onSpeedChange: (seconds: number) => void;
}) {
  const [speedOpen, setSpeedOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const complete = endedByWinner || activeIndex >= queue.length;
  const token = queue[activeIndex];
  const storyCue = useRef<HTMLButtonElement>(null);
  const storyCueFocused = useRef(false);
  const storyOrigin = useRef<StoryOrigin>(undefined);
  const pauseButton = useRef<HTMLButtonElement>(null);
  const wasStoryOpen = useRef(false);

  useLayoutEffect(() => {
    if (!storyOpen && wasStoryOpen.current) {
      (paused ? storyCue.current : pauseButton.current)?.focus({ preventScroll: true });
    }
    wasStoryOpen.current = storyOpen;
  }, [paused, storyOpen]);

  useLayoutEffect(() => {
    if (!story && storyCueFocused.current) {
      storyCueFocused.current = false;
      if (document.activeElement === document.body) pauseButton.current?.focus({ preventScroll: true });
    }
  }, [story]);

  useEffect(() => {
    const updateFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  };

  const handleTogglePause = () => {
    if (paused) {
      setSpeedOpen(false);
      onResume();
    } else {
      onPause();
    }
  };

  if (complete) {
    return (
      <main className="game-page game-stage-page game-complete">
        <a className="game-brand" href={gameHref}>Loto Art Studio</a>
        <section>
          <p className="game-kicker">{endedByWinner ? t("gameWinnerMessage") : `${queue.length} ${t("usedTokens")}`}</p>
          <h1>{endedByWinner ? t("gameWinnerTitle") : t("gameComplete")}</h1>
          <div className="game-complete-actions">
            <button className="game-start" type="button" onClick={onRestart}><RotateCcw size={18} />{t("newRound")}</button>
            <button className="game-quiet-button" type="button" onClick={onBackToSetup}><Settings size={18} />{t("gameBackToSetup")}</button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`game-page game-stage-page${paused ? " is-paused" : ""}`} style={{ "--token-duration": `${durationMs}ms` } as CSSProperties} onClick={onPause}>
      <div className="game-progress"><progress value={activeIndex + 1} max={queue.length} /></div>
      <header className="game-header">
        <a className="game-brand" href={gameHref} onClick={(event) => event.stopPropagation()}>Loto Art Studio</a>
        <div className="game-header-status">
          <div className="game-counter" aria-live="polite">{activeIndex + 1} / {queue.length}</div>
          <button className="game-fullscreen" type="button" aria-label={fullscreen ? t("exitFullscreen") : t("enterFullscreen")} onClick={(event) => { event.stopPropagation(); void toggleFullscreen(); }}>{fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
        </div>
      </header>
      <section className="game-token" aria-label={t("currentToken")}>
        {token.kind === "art" ? <ArtworkToken key={`${activeIndex}:${token.artwork.id}`} artwork={token.artwork} languages={languages} /> : <>
          <strong key={`number-${token.number}`} className="game-number">{token.number}</strong>
          <div key={`number-labels-${token.number}`} className="game-number-labels">{languages.map((language) => {
            const label = numberNickname(token.number, language);
            return label ? <p key={language}>{label}</p> : null;
          })}</div>
        </>}
        {story && token.kind === "art" && <button key={activeIndex} ref={storyCue} className="game-story-cue" type="button" aria-haspopup="dialog" onFocus={() => { storyCueFocused.current = true; }} onBlur={(event) => { if (event.relatedTarget) storyCueFocused.current = false; }} onClick={(event) => {
          event.stopPropagation();
          setSpeedOpen(false);
          storyOrigin.current = storyOriginFrom(event.currentTarget.parentElement?.querySelector("img"));
          onOpenStory();
        }}>
          <span className="game-story-cue-preview" aria-hidden="true" style={{ backgroundImage: `url("${token.artwork.imageUrl}")`, backgroundPosition: `${story.spots[0].x}% ${story.spots[0].y}%` }} />
          <span className="game-story-cue-text">
            <span className="game-story-cue-kicker">{t("artStory")}</span>
            <span className="game-story-cue-headline">{story.copy[storyLocale(interfaceLanguage)].headline}</span>
            <span className="game-story-cue-hint">{t("storyCueHint")}</span>
          </span>
          <ChevronRight className="game-story-cue-chevron" size={18} aria-hidden="true" />
        </button>}
      </section>
      {storyOpen && story && token.kind === "art" && <GameArtStory story={story} artwork={token.artwork} origin={storyOrigin.current} language={interfaceLanguage} t={t} onClose={onCloseStory} onResume={onResume} />}
      {paused && <button className="game-end-button" type="button" onClick={(event) => { event.stopPropagation(); onEndGame(); }}>{t("endGame")}</button>}
      <div className="game-playback-dock">
        <div className="game-controls" onClick={(event) => event.stopPropagation()}>
          <button type="button" aria-label={t("previous")} onClick={onPrevious} disabled={!activeIndex}><ChevronLeft size={21} /></button>
          <button ref={pauseButton} className="game-pause" type="button" style={{ "--token-progress": countdownProgress } as CSSProperties} aria-label={paused ? t("resume") : t("pause")} onClick={handleTogglePause}>{paused ? <Play size={20} /> : <Pause size={20} />}</button>
          <button type="button" aria-label={t("next")} onClick={onNext}><ChevronRight size={21} /></button>
        </div>
        <div className="game-speed-control" onClick={(event) => event.stopPropagation()}>
          <button className="game-speed-button" type="button" aria-label={t("gameSpeed")} aria-expanded={speedOpen} onClick={() => setSpeedOpen((current) => !current)}><GameSpeedometer seconds={secondsPerToken} /></button>
          {speedOpen && <div className="game-speed-popover">
            <button type="button" aria-label={t("slower")} onClick={() => onSpeedChange(slowerSeconds(secondsPerToken))}><Minus size={15} /></button>
            <input type="range" min="0" max={MAX_PACE_SLIDER_VALUE} step="1" value={sliderValueFromSeconds(secondsPerToken)} onChange={(event) => onSpeedChange(secondsFromSliderValue(Number(event.target.value)))} aria-label={t("gameSpeed")} />
            <button type="button" aria-label={t("faster")} onClick={() => onSpeedChange(fasterSeconds(secondsPerToken))}><Plus size={15} /></button>
            <output>{secondsPerToken} {t("secondsShort")}</output>
          </div>}
        </div>
      </div>
    </main>
  );
}

function ArtworkToken({ artwork, languages }: { artwork: Artwork; languages: string[] }) {
  const [ready, setReady] = useState(false);
  return <>
    <ArtworkImage src={artwork.imageUrl} onReady={() => setReady(true)} />
    <div className={`game-art-labels${ready ? " is-ready" : ""}`}>
      {languages.map((language) => <p key={language}>{titleFor(artwork, language)}</p>)}
      {(artwork.author || artwork.year) && <small>{[artwork.author, artwork.year].filter(Boolean).join(" · ")}</small>}
    </div>
  </>;
}

function ArtworkImage({ src, onReady }: { src: string; onReady: () => void }) {
  const [orientation, setOrientation] = useState<MediaOrientation>("square");
  const [loaded, setLoaded] = useState(false);
  return <img className={`${orientation}${loaded ? " is-ready" : ""}`} src={src} alt="" onLoad={(event) => {
    setOrientation(orientationFromDimensions(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight));
    setLoaded(true);
    onReady();
  }} onError={onReady} />;
}
