import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowUpRight, Pause, Play, X } from "lucide-react";
import { storyLocale, type ArtStory } from "../game/artStories";
import { artworkDetailCrop } from "../game/media";
import type { MessageKey } from "../i18n";
import type { Artwork } from "../types";
import { titleFor } from "./LotoViews";
import { StoryOrnament, StorySpray } from "./StoryOrnament";

const hoverMotion = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";
const flight = { duration: 480, easing: "cubic-bezier(.32, .72, 0, 1)" };

export type StoryOrigin = { rect: DOMRect; width: number; height: number };

// The visible picture inside an <img>, which object-fit: contain may letterbox.
export function storyOriginFrom(image: HTMLImageElement | null | undefined): StoryOrigin | undefined {
  if (!image?.naturalWidth) return undefined;
  const box = image.getBoundingClientRect();
  const { naturalWidth: width, naturalHeight: height } = image;
  if (getComputedStyle(image).objectFit !== "contain") return { rect: box, width, height };
  const scale = Math.min(box.width / width, box.height / height);
  const w = width * scale, h = height * scale;
  return { rect: new DOMRect(box.x + (box.width - w) / 2, box.y + (box.height - h) / 2, w, h), width, height };
}

export function GameArtStory({ artwork, story, origin, language, t, onClose, onResume }: {
  artwork: Artwork;
  origin?: StoryOrigin;
  story: ArtStory;
  language: string;
  t: (key: MessageKey) => string;
  onClose: () => void;
  onResume: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const artFrame = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [imageSize, setImageSize] = useState(origin && { width: origin.width, height: origin.height });
  const locale = storyLocale(language);
  const detail = selected === null ? undefined : story.spots[selected];
  const copy = (detail ?? story).copy[locale];
  const title = titleFor(artwork, language);
  const crop = detail && imageSize && artworkDetailCrop(imageSize.width, imageSize.height, detail.x, detail.y);

  useLayoutEffect(() => {
    const panel = dialog.current;
    panel?.showModal();
    heading.current?.focus({ preventScroll: true });
    // Fly the picture from its place on the game stage into the gallery frame.
    const frame = artFrame.current;
    const target = frame?.getBoundingClientRect();
    if (origin && frame && target?.width && matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      const from = `translate(${origin.rect.left - target.left}px, ${origin.rect.top - target.top}px) scale(${origin.rect.width / target.width}, ${origin.rect.height / target.height})`;
      frame.animate([{ transform: from, transformOrigin: "0 0" }, { transform: "none", transformOrigin: "0 0" }], flight);
    }
    return () => panel?.close();
  }, []);

  const tiltArt = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !matchMedia(hoverMotion).matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const { style } = event.currentTarget;
    style.setProperty("--tilt-x", `${(.5 - y) * 7}deg`);
    style.setProperty("--tilt-y", `${(x - .5) * 9}deg`);
    style.setProperty("--glare-x", `${x * 100}%`);
    style.setProperty("--glare-y", `${y * 100}%`);
  };
  const resetTilt = ({ currentTarget }: PointerEvent<HTMLDivElement>) => {
    for (const name of ["--tilt-x", "--tilt-y", "--glare-x", "--glare-y"]) currentTarget.style.removeProperty(name);
  };

  return <dialog ref={dialog} className="game-art-explore" aria-labelledby="game-story-title" onClick={(event) => event.stopPropagation()} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="game-art-explore-inner">
      <StoryOrnament />
      <header className="game-art-explore-top">
        {!detail && <p className="game-story-status"><Pause size={14} aria-hidden="true" />{t("storyPaused")}</p>}
        <button className="game-story-close" type="button" aria-label={t("storyClose")} onClick={onClose}><X size={20} aria-hidden="true" /></button>
      </header>
      <div className="game-art-explore-layout">
        <div className="game-spot-frame" style={{ "--art-ratio": imageSize ? imageSize.width / imageSize.height : 1 } as CSSProperties} ref={artFrame} onPointerMove={tiltArt} onPointerLeave={resetTilt}>
          <div className="game-spot-layer">
            <img src={artwork.imageUrl} alt={title} onLoad={({ currentTarget: image }) => setImageSize({ width: image.naturalWidth, height: image.naturalHeight })} />
            {imageSize && story.spots.map((spot, index) => (
              <div key={index} className={`game-spot${spot.x > 70 ? " is-left" : ""}`} style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
                <button type="button" aria-label={spot.copy[locale].headline} aria-pressed={index === selected} aria-controls="game-story-detail" onClick={() => setSelected(index === selected ? null : index)}>
                  <span aria-hidden="true">{index + 1}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className={`game-story-sheet${crop ? " has-loupe" : ""}`}>
          {crop && imageSize && selected !== null && <div className="game-story-loupe-row">
            <svg className="game-story-loupe" viewBox={`${crop.left} ${crop.top} ${crop.size} ${crop.size}`} aria-hidden="true" focusable="false">
              <image href={artwork.imageUrl} width={imageSize.width} height={imageSize.height} />
            </svg>
            <div className="game-story-index" aria-hidden="true">
              <span>{t("storyDetail")}</span>
              <strong>{String(selected + 1).padStart(2, "0")}</strong><span> / {String(story.spots.length).padStart(2, "0")}</span>
            </div>
            <StorySpray className="game-story-botanical" />
          </div>}
          <h2 id="game-story-title" ref={heading} tabIndex={-1} hidden={!!detail}>{title}</h2>
          {!detail && <>
            <p className="game-story-meta">{[artwork.author, artwork.year].filter(Boolean).join(" · ")}</p>
            <div className="game-story-rule" aria-hidden="true"><StorySpray className="game-story-filigree" /></div>
          </>}
          <div id="game-story-detail" aria-live="polite" aria-atomic="true">
            <h3>{copy.headline}</h3>
            <p className="game-story-fact">{copy.fact}</p>
          </div>
          <p className="game-story-source">{t("storySource")} <a href={detail?.url ?? story.url} target="_blank" rel="noopener noreferrer">{story.museum}<ArrowUpRight size={14} aria-hidden="true" /></a></p>
          <div className="game-story-footer">
            <p>{t("storyExplore")}</p>
            <button type="button" className="game-story-return" onClick={onResume}><Play size={15} aria-hidden="true" />{t("storyResume")}</button>
          </div>
        </div>
      </div>
    </div>
  </dialog>;
}