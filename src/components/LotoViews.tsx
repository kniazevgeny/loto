import { useRef, useState } from "react";
import { Grid3X3, Maximize2, MoveDiagonal2, RefreshCw } from "lucide-react";
import { tr, type MessageKey } from "../i18n";
import type { Artwork, Card, DesignSettings, Project } from "../types";
import { SegmentedControl } from "./Controls";

export type SelectedCell = { cardIndex: number; cellIndex: number } | null;

export function titleFor(artwork: Artwork, language: string) {
  return artwork.titles[language] || artwork.titles.fr || artwork.titles.en || artwork.titles.ru || artwork.id;
}

export function cardStyle(design: DesignSettings) {
  return {
    "--card-color": design.cardColor,
    "--cell-color": design.cellColor,
    "--border-color": design.borderColor,
    "--number-color": design.numberColor,
    "--title-color": design.titleColor,
    "--meta-color": design.metaColor,
    "--border-width": `${design.borderWidthMm}mm`,
    "--cell-radius": `${design.cellRadiusMm}mm`,
    "--card-radius": `${design.cardRadiusMm}mm`,
    "--card-padding": `${design.cardPaddingMm}mm`,
    "--gradient-opacity": String(design.gradientOpacity),
    "--number-font": `"${design.numberFont}", Arial, sans-serif`,
    "--title-font": `"${design.titleFont}", Arial, sans-serif`,
    "--meta-font": `"${design.metaFont}", Arial, sans-serif`,
    "--number-size": `${design.numberFontSizePt}pt`,
    "--title-size": `${design.titleFontSizePt}pt`,
    "--meta-size": `${design.metaFontSizePt}pt`,
    "--ornament-color": design.ornamentColor,
    "--ornament-opacity": String(design.ornamentOpacity),
    "--ornament-scale": String(design.ornamentScale),
    "--custom-ornament": design.customOrnament ? `url("${design.customOrnament}")` : "none",
  } as React.CSSProperties;
}

function ResizeHandle({
  colSpan, rowSpan, label, onResize,
}: {
  colSpan: 1 | 2;
  rowSpan: 1 | 2;
  label: string;
  onResize: (colSpan: 1 | 2, rowSpan: 1 | 2) => void;
}) {
  const drag = useRef<{ left: number; top: number; cellWidth: number; cellHeight: number } | null>(null);
  const [preview, setPreview] = useState<[1 | 2, 1 | 2] | null>(null);
  const updatePreview = (clientX: number, clientY: number) => {
    if (!drag.current) return;
    const { left, top, cellWidth, cellHeight } = drag.current;
    const columns = Math.max(1, Math.min(2, Math.ceil((clientX - left) / cellWidth))) as 1 | 2;
    const rows = Math.max(1, Math.min(2, Math.ceil((clientY - top) / cellHeight))) as 1 | 2;
    setPreview([columns, rows]);
  };

  return (
    <span
      className={`resize-handle ${preview ? "dragging" : ""}`}
      title={label}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const cell = event.currentTarget.closest<HTMLElement>(".loto-cell");
        if (!cell) return;
        const bounds = cell.getBoundingClientRect();
        drag.current = {
          left: bounds.left,
          top: bounds.top,
          cellWidth: bounds.width / colSpan,
          cellHeight: bounds.height / rowSpan,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
        setPreview([colSpan, rowSpan]);
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        event.preventDefault();
        event.stopPropagation();
        updatePreview(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        if (!drag.current) return;
        event.preventDefault();
        event.stopPropagation();
        const next = preview || [colSpan, rowSpan];
        drag.current = null;
        setPreview(null);
        onResize(next[0], next[1]);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setPreview(null);
      }}
    >
      <MoveDiagonal2 size={13} />
      {preview && <small>{preview[0]}×{preview[1]}</small>}
    </span>
  );
}

export function CardView({
  card, cardIndex, artworks, project, selectedCell, onSelect, onResize,
}: {
  card: Card;
  cardIndex: number;
  artworks: Map<string, Artwork>;
  project: Project;
  selectedCell: SelectedCell;
  onSelect?: (selection: SelectedCell) => void;
  onResize?: (cardIndex: number, cellIndex: number, colSpan: 1 | 2, rowSpan: 1 | 2) => void;
}) {
  const design = project.design;
  return (
    <div className={`loto-card ornament-${design.ornament} shape-${design.cellShape}`} style={cardStyle(design)} data-card={cardIndex + 1}>
      <div className="card-grid">
        {card.cells.map((cell, cellIndex) => {
          if (cell.kind === "covered") return null;
          const selected = selectedCell?.cardIndex === cardIndex && selectedCell.cellIndex === cellIndex;
          const column = cellIndex % 9;
          const row = Math.floor(cellIndex / 9);
          if (cell.kind === "number") {
            return (
              <button type="button" className={`loto-cell number-cell ${selected ? "selected" : ""}`} key={cellIndex} style={{ gridColumn: column + 1, gridRow: row + 1 }} onClick={() => onSelect?.({ cardIndex, cellIndex })}>
                <span>{cell.number}</span>
              </button>
            );
          }
          const artwork = artworks.get(cell.artworkId);
          const colSpan = cell.colSpan || 1;
          const rowSpan = cell.rowSpan || 1;
          return (
            <div
              role="button"
              tabIndex={0}
              className={`loto-cell art-cell ${selected ? "selected" : ""}`}
              key={cellIndex}
              title={artwork ? titleFor(artwork, project.language) : ""}
              onClick={() => onSelect?.({ cardIndex, cellIndex })}
              onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onSelect?.({ cardIndex, cellIndex })}
              style={{ gridColumn: `${column + 1} / span ${colSpan}`, gridRow: `${row + 1} / span ${rowSpan}`, width: `${colSpan * 30}mm`, height: `${rowSpan * 30}mm` }}
            >
              {artwork ? <img src={artwork.imageUrl} alt="" style={{ objectFit: project.design.cardImageFit, objectPosition: "center center" }} /> : <span className="missing-art">{tr(project.language, "missingImage")}</span>}
              {onResize && <ResizeHandle colSpan={colSpan} rowSpan={rowSpan} label={tr(project.language, "resizeArtwork")} onResize={(columns, rows) => onResize(cardIndex, cellIndex, columns, rows)} />}
            </div>
          );
        })}
      </div>
      <span className="card-index">{cardIndex + 1}</span>
    </div>
  );
}

export function TokenView({ number, artwork, language, design, onArtworkClick }: { number?: number; artwork?: Artwork; language: string; design: DesignSettings; onArtworkClick?: (artworkId: string) => void }) {
  return (
    <div
      className={`print-token shape-${design.cellShape} ${artwork ? "art-token" : "number-token"} ${artwork && onArtworkClick ? "interactive-token" : ""}`}
      style={cardStyle(design)}
      role={artwork && onArtworkClick ? "button" : undefined}
      tabIndex={artwork && onArtworkClick ? 0 : undefined}
      onClick={() => artwork && onArtworkClick?.(artwork.id)}
      onKeyDown={(event) => artwork && onArtworkClick && (event.key === "Enter" || event.key === " ") && onArtworkClick(artwork.id)}
      title={artwork ? titleFor(artwork, language) : undefined}
    >
      {artwork ? (
        <>
          <img src={artwork.imageUrl} alt="" style={{ objectFit: artwork.fit || "contain", objectPosition: "center top" }} />
          <span className="token-label">
            <strong>{titleFor(artwork, language)}</strong>
            <small>{[artwork.author, artwork.year].filter(Boolean).join(", ")}</small>
          </span>
        </>
      ) : <span className="token-number">{number}</span>}
    </div>
  );
}

export function WelcomeScreen({ t, onGenerate }: { t: (key: MessageKey) => string; onGenerate: () => void }) {
  const [media, setMedia] = useState<"demo" | "process">("demo");
  return (
    <div className="welcome-state">
      <div className="empty-state"><Grid3X3 size={34} /><h2>{t("emptyTitle")}</h2><p>{t("emptyText")}</p><button className="primary-button" onClick={onGenerate}><RefreshCw size={17} />{t("generate24")}</button></div>
      <div className="process-panel">
        <div className="process-copy">
          <h2>{media === "demo" ? t("demoTitle") : t("processVideo")}</h2>
          {media === "process" && <p>{t("processDescription")}</p>}
        </div>
        <SegmentedControl
          value={media}
          options={[
            { value: "demo", label: t("productDemo") },
            { value: "process", label: t("processTab") },
          ]}
          onChange={setMedia}
          ariaLabel={t("welcomeMedia")}
        />
        <div className="process-video">
          {media === "demo" ? (
            <>
              <iframe src={`${import.meta.env.BASE_URL}promo.html?embed=1`} title={t("productDemo")} />
              <button
                type="button"
                className="promo-launch"
                title={t("openDemo")}
                aria-label={t("openDemo")}
                onClick={() => window.location.assign(`${import.meta.env.BASE_URL}promo.html?from=welcome`)}
              >
                <Maximize2 size={18} />
              </button>
            </>
          ) : (
            <iframe
              src="https://www.youtube-nocookie.com/embed/jJUMiEiZGrY"
              title={t("processVideo")}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
}
