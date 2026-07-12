import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Globe2,
  Grid3X3,
  ImagePlus,
  Languages,
  Palette,
  Printer,
  RefreshCw,
  Save,
  Settings2,
  Tags,
  Upload,
  X,
} from "lucide-react";
import { createDefaultProject, defaultDesign, GOOGLE_FONTS } from "./defaults";
import { loadLatestProject, saveProject } from "./db";
import { prepareFonts } from "./fonts";
import { generateCards, validateCard } from "./generator";
import { exportProjectFile, loadBuiltinLibrary, readFileAsDataUrl } from "./library";
import { tr, type MessageKey } from "./i18n";
import type { Artwork, Card, Cell, DesignSettings, Project } from "./types";

type Tab = "cards" | "library" | "design";
type SelectedCell = { cardIndex: number; cellIndex: number } | null;
type PrintMode = "cards" | "tokens";
type PreviewMode = "cards" | "tokens";

interface OnlineArtwork {
  id: string;
  title: string;
  imageUrl: string;
  sourceUrl: string;
  author: string;
  year: string;
  license: string;
}

interface TokenItem {
  number?: number;
  artwork?: Artwork;
}

const COLUMN_RANGES: Array<[number, number]> = [
  [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
  [50, 59], [60, 69], [70, 79], [80, 90],
];

function titleFor(artwork: Artwork, language: string) {
  return artwork.titles[language] || artwork.titles.fr || artwork.titles.en || artwork.titles.ru || artwork.id;
}

function stripHtml(value = "") {
  const element = document.createElement("div");
  element.innerHTML = value;
  return element.textContent?.trim() || "";
}

function cardStyle(design: DesignSettings) {
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

function geometryIssue(design: DesignSettings, language: string) {
  const cardWidth = 270 + design.cardPaddingMm * 2;
  const cardHeight = 90 + design.cardPaddingMm * 2;
  const widthNeeded = cardWidth + design.pageMarginXmm * 2;
  const heightNeeded = cardHeight * 2 + design.centerGapMm + design.pageMarginYmm * 2;
  if (widthNeeded > 297 || heightNeeded > 210) {
    return `${tr(language, "layoutOverflow")} ${Math.max(0, widthNeeded - 297).toFixed(1)} × ${Math.max(0, heightNeeded - 210).toFixed(1)} mm.`;
  }
  return null;
}

function CardView({
  card,
  cardIndex,
  artworks,
  project,
  selectedCell,
  onSelect,
}: {
  card: Card;
  cardIndex: number;
  artworks: Map<string, Artwork>;
  project: Project;
  selectedCell: SelectedCell;
  onSelect?: (selection: SelectedCell) => void;
}) {
  const design = project.design;
  return (
    <div
      className={`loto-card ornament-${design.ornament} shape-${design.cellShape}`}
      style={cardStyle(design)}
      data-card={cardIndex + 1}
    >
      <div className="card-grid">
        {card.cells.map((cell, cellIndex) => {
          const selected = selectedCell?.cardIndex === cardIndex && selectedCell.cellIndex === cellIndex;
          if (cell.kind === "number") {
            return (
              <button
                type="button"
                className={`loto-cell number-cell ${selected ? "selected" : ""}`}
                key={cellIndex}
                onClick={() => onSelect?.({ cardIndex, cellIndex })}
              >
                <span>{cell.number}</span>
              </button>
            );
          }
          const artwork = artworks.get(cell.artworkId);
          return (
            <button
              type="button"
              className={`loto-cell art-cell ${selected ? "selected" : ""}`}
              key={cellIndex}
              title={artwork ? titleFor(artwork, project.language) : ""}
              onClick={() => onSelect?.({ cardIndex, cellIndex })}
            >
              {artwork ? (
                <>
                  <img
                    src={artwork.imageUrl}
                    alt=""
                    style={{
                      objectFit: artwork.fit || "contain",
                      objectPosition: "center center",
                    }}
                  />
                </>
              ) : <span className="missing-art">{tr(project.language, "missingImage")}</span>}
            </button>
          );
        })}
      </div>
      <span className="card-index">{cardIndex + 1}</span>
    </div>
  );
}

function TokenView({ number, artwork, language, design, onArtworkClick }: { number?: number; artwork?: Artwork; language: string; design: DesignSettings; onArtworkClick?: (artworkId: string) => void }) {
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function RangeField({
  label, value, min, max, step = 1, unit = "", onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <div className="range-row">
        <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <output>{value}{unit}</output>
      </div>
    </Field>
  );
}

function WelcomeScreen({ t, onGenerate }: { t: (key: MessageKey) => string; onGenerate: () => void }) {
  return (
    <div className="welcome-state">
      <div className="empty-state"><Grid3X3 size={34} /><h2>{t("emptyTitle")}</h2><p>{t("emptyText")}</p><button className="primary-button" onClick={onGenerate}><RefreshCw size={17} />{t("generate24")}</button></div>
      <div className="process-panel">
        <div className="process-copy"><h2>{t("processVideo")}</h2><p>{t("processDescription")}</p></div>
        <div className="process-video">
          <iframe
            src="https://www.youtube-nocookie.com/embed/jJUMiEiZGrY"
            title={t("processVideo")}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

function App() {
  const [builtin, setBuiltin] = useState<Artwork[]>([]);
  const [project, setProject] = useState<Project>(() => createDefaultProject());
  const [tab, setTab] = useState<Tab>("cards");
  const [sheetIndex, setSheetIndex] = useState(0);
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [status, setStatus] = useState("…");
  const [error, setError] = useState<string | null>(null);
  const [librarySearch, setLibrarySearch] = useState("");
  const [focusedArtworkId, setFocusedArtworkId] = useState<string | null>(null);
  const [onlineQuery, setOnlineQuery] = useState("");
  const [onlineResults, setOnlineResults] = useState<OnlineArtwork[]>([]);
  const [onlineStatus, setOnlineStatus] = useState("");
  const [printMode, setPrintMode] = useState<PrintMode>("cards");
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("cards");
  const [tokenPageIndex, setTokenPageIndex] = useState(0);
  const importRef = useRef<HTMLInputElement>(null);

  const artworks = useMemo(() => [...builtin, ...project.customArtworks], [builtin, project.customArtworks]);
  const artworkMap = useMemo(() => new Map(artworks.map((artwork) => [artwork.id, artwork])), [artworks]);
  const selectedArtworks = useMemo(
    () => artworks.filter((artwork) => project.selectedArtworkIds.includes(artwork.id)),
    [artworks, project.selectedArtworkIds],
  );
  const sheets = useMemo(() => {
    const result: Card[][] = [];
    for (let index = 0; index < project.cards.length; index += 2) result.push(project.cards.slice(index, index + 2));
    return result;
  }, [project.cards]);
  const t = (key: MessageKey) => tr(project.language, key);
  const fitIssue = geometryIssue(project.design, project.language);
  const tokenItems = useMemo<TokenItem[]>(() => [
    ...Array.from({ length: 90 }, (_, index) => ({ number: index + 1 })),
    ...selectedArtworks.map((artwork) => ({ artwork })),
  ], [selectedArtworks]);
  const tokenPages = useMemo(() => {
    const pages: typeof tokenItems[] = [];
    for (let index = 0; index < tokenItems.length; index += 54) pages.push(tokenItems.slice(index, index + 54));
    return pages;
  }, [tokenItems]);

  useEffect(() => {
    Promise.all([loadBuiltinLibrary(), loadLatestProject()])
      .then(([library, saved]) => {
        setBuiltin(library);
        const next = saved || createDefaultProject();
        next.design = { ...defaultDesign, ...next.design };
        if (!next.selectedArtworkIds.length) next.selectedArtworkIds = library.map((item) => item.id);
        setProject(next);
        setStatus(tr(next.language, saved ? "restored" : "newProject"));
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : String(reason));
        setStatus(tr(project.language, "error"));
      });
  }, []);

  useEffect(() => {
    if (!builtin.length) return;
    const timer = window.setTimeout(() => {
      const next = { ...project, updatedAt: new Date().toISOString() };
      saveProject(next).then(() => setStatus(t("saved"))).catch(() => setStatus(t("saveFailed")));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [project, builtin.length]);

  useEffect(() => {
    prepareFonts([project.design.numberFont, project.design.titleFont, project.design.metaFont]);
  }, [project.design.numberFont, project.design.titleFont, project.design.metaFont]);

  useEffect(() => {
    document.documentElement.lang = project.language;
  }, [project.language]);

  useEffect(() => {
    if (tab !== "library" || !focusedArtworkId) return;
    const timer = window.setTimeout(() => {
      document.querySelector(`[data-artwork-id="${focusedArtworkId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [tab, focusedArtworkId]);

  const updateProject = (patch: Partial<Project>) => setProject((current) => ({ ...current, ...patch }));
  const updateDesign = <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) =>
    setProject((current) => ({ ...current, design: { ...current.design, [key]: value } }));

  const regenerate = () => {
    setError(null);
    const nextSeed = project.seed + 1;
    const result = generateCards(project.cardCount, selectedArtworks, project.repeatCap, nextSeed);
    if (result.issue) {
      setError(`${t("libraryInsufficient")} ${result.issue.additionalImagesNeeded} ${t("imagesNeeded")} ${result.issue.minimumImages}.`);
      return;
    }
    updateProject({ cards: result.cards, seed: nextSeed });
    setSheetIndex(0);
    setSelectedCell(null);
    setStatus(`${result.cards.length} ${t("cardsGenerated")}`);
  };

  const replaceCell = (artworkId: string) => {
    if (!selectedCell) return;
    const cards = project.cards.map((card, cardIndex) => {
      if (cardIndex !== selectedCell.cardIndex) return card;
      return {
        ...card,
        cells: card.cells.map((cell, cellIndex) =>
          cellIndex === selectedCell.cellIndex ? { kind: "art", artworkId } as Cell : cell,
        ),
      };
    });
    updateProject({ cards });
  };

  const editNumber = (value: number) => {
    if (!selectedCell) return;
    const column = selectedCell.cellIndex % 9;
    const [min, max] = COLUMN_RANGES[column];
    if (value < min || value > max) {
      setError(`${t("columnOnly")} ${min}–${max}.`);
      return;
    }
    const card = project.cards[selectedCell.cardIndex];
    if (card.cells.some((cell, index) => index !== selectedCell.cellIndex && cell.kind === "number" && cell.number === value)) {
      setError(t("duplicateNumber"));
      return;
    }
    const cards = project.cards.map((candidate, cardIndex) => cardIndex !== selectedCell.cardIndex ? candidate : {
      ...candidate,
      cells: candidate.cells.map((cell, cellIndex) => cellIndex === selectedCell.cellIndex ? { kind: "number", number: value } as Cell : cell),
    });
    setError(null);
    updateProject({ cards });
  };

  const addArtwork = async (file: File) => {
    const imageUrl = await readFileAsDataUrl(file);
    const item: Artwork = {
      id: crypto.randomUUID(), imageUrl, titles: { fr: file.name.replace(/\.[^.]+$/, "") },
      author: "", year: "", license: "Custom", custom: true, fit: "contain", anchor: "top",
    };
    updateProject({
      customArtworks: [...project.customArtworks, item],
      selectedArtworkIds: [...project.selectedArtworkIds, item.id],
    });
  };

  const updateArtwork = (id: string, patch: Partial<Artwork>) => {
    if (!project.customArtworks.some((item) => item.id === id)) return;
    updateProject({ customArtworks: project.customArtworks.map((item) => item.id === id ? { ...item, ...patch } : item) });
  };

  const focusArtwork = (artworkId: string) => {
    setLibrarySearch("");
    setFocusedArtworkId(artworkId);
    setTab("library");
  };

  const searchCommons = async () => {
    const query = onlineQuery.trim();
    if (!query) return;
    setOnlineStatus(t("searching"));
    setOnlineResults([]);
    try {
      const params = new URLSearchParams({
        origin: "*", action: "query", format: "json", generator: "search",
        gsrsearch: query, gsrnamespace: "6", gsrlimit: "18", prop: "imageinfo",
        iiprop: "url|extmetadata", iiurlwidth: "512",
      });
      const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`);
      if (!response.ok) throw new Error(t("commonsDown"));
      const payload = await response.json() as {
        query?: { pages?: Record<string, { pageid: number; title: string; imageinfo?: Array<{ thumburl?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }> }> };
      };
      const results = Object.values(payload.query?.pages || {}).flatMap((page) => {
        const info = page.imageinfo?.[0];
        if (!info?.thumburl) return [];
        const metadata = info.extmetadata || {};
        return [{
          id: `commons-${page.pageid}`,
          title: stripHtml(metadata.ObjectName?.value || page.title.replace(/^File:/, "").replace(/\.[^.]+$/, "")),
          imageUrl: info.thumburl,
          sourceUrl: info.descriptionurl || "https://commons.wikimedia.org/",
          author: stripHtml(metadata.Artist?.value || ""),
          year: stripHtml(metadata.DateTimeOriginal?.value || ""),
          license: stripHtml(metadata.LicenseShortName?.value || t("licenseCheck")),
        }];
      });
      setOnlineResults(results);
      setOnlineStatus(`${results.length} ${t("results")}`);
    } catch (reason) {
      setOnlineStatus(reason instanceof Error ? reason.message : t("searchFailed"));
    }
  };

  const importOnlineArtwork = (result: OnlineArtwork) => {
    if (project.customArtworks.some((item) => item.id === result.id)) return;
    const item: Artwork = {
      id: result.id,
      imageUrl: result.imageUrl,
      titles: { fr: result.title, en: result.title },
      author: result.author,
      year: result.year,
      sourceUrl: result.sourceUrl,
      license: "Custom",
      category: "custom",
      custom: true,
      fit: "contain",
      anchor: "top",
    };
    updateProject({ customArtworks: [...project.customArtworks, item], selectedArtworkIds: [...project.selectedArtworkIds, item.id] });
    setFocusedArtworkId(item.id);
    setOnlineStatus(`« ${result.title} » ${t("added")} · ${result.license}`);
  };

  const handleImport = async (file: File) => {
    try {
      const data = JSON.parse(await file.text()) as Project;
      if (data.schemaVersion !== 1 || !Array.isArray(data.cards)) throw new Error(t("badProject"));
      data.design = { ...defaultDesign, ...data.design };
      setProject(data);
      setStatus(t("imported"));
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("importFailed"));
    }
  };

  const printProject = async (mode: PrintMode) => {
    if (mode === "cards" && fitIssue) { setError(fitIssue); return; }
    if (mode === "cards" && !project.cards.length) { setError(t("generateFirst")); return; }
    setPrintMode(mode);
    setPrintDialogOpen(false);
    await prepareFonts([project.design.numberFont, project.design.titleFont, project.design.metaFont]);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    window.print();
  };

  const selected = selectedCell ? project.cards[selectedCell.cardIndex]?.cells[selectedCell.cellIndex] : null;
  const filteredLibrary = artworks.filter((artwork) =>
    `${titleFor(artwork, project.language)} ${artwork.author}`.toLowerCase().includes(librarySearch.toLowerCase()),
  );

  return (
    <div className="app-shell">
      <section className="mobile-welcome">
        <div className="mobile-header">
          <div className="mobile-brand"><Grid3X3 size={20} /><span>Loto Art Studio</span></div>
          <div className="mobile-language" role="group" aria-label={t("language")}>
            {(["en", "fr", "ru"] as const).map((language) => (
              <button
                type="button"
                className={project.language === language ? "active" : ""}
                key={language}
                onClick={() => updateProject({ language })}
              >
                {language.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <WelcomeScreen t={t} onGenerate={regenerate} />
      </section>
      <header className="app-header">
        <div className="brand"><Grid3X3 size={19} /><span>Loto Art Studio</span></div>
        <input className="project-name" value={project.name} onChange={(event) => updateProject({ name: event.target.value })} aria-label={t("projectName")} />
        <span className="save-state"><Save size={14} />{status}</span>
        <label className="header-select"><Languages size={16} /><select value={project.language} onChange={(event) => updateProject({ language: event.target.value })}><option value="fr">Français</option><option value="en">English</option><option value="ru">Русский</option></select></label>
        <button className="icon-button" title={t("importProject")} onClick={() => importRef.current?.click()}><Upload size={18} /></button>
        <input ref={importRef} hidden type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && handleImport(event.target.files[0])} />
        <button className="icon-button" title={t("exportProject")} onClick={() => exportProjectFile(project, project.name)}><Download size={18} /></button>
        <button className="primary-button" onClick={() => setPrintDialogOpen(true)}><Printer size={17} />{t("print")}</button>
      </header>

      {printDialogOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPrintDialogOpen(false)}>
          <section className="print-dialog" role="dialog" aria-modal="true" aria-labelledby="print-dialog-title">
            <div className="dialog-header">
              <div><h2 id="print-dialog-title">{t("printSet")}</h2><p>{t("printBoth")}</p></div>
              <button className="icon-button" title="Close" onClick={() => setPrintDialogOpen(false)}><X size={17} /></button>
            </div>
            <div className="print-steps">
              <article className="print-step">
                <div className="step-icon"><Tags size={20} /></div>
                <div className="step-copy"><h3>{t("tokenStep")}</h3><p>{t("tokenStepHelp")}</p></div>
                <button className="wide-button" onClick={() => printProject("tokens")}><Printer size={16} />{t("titledTokens")}</button>
              </article>
              <article className="print-step">
                <div className="step-icon"><Grid3X3 size={20} /></div>
                <div className="step-copy"><h3>{t("cardStep")}</h3><p>{t("cardStepHelp")}</p></div>
                <button className="wide-button" onClick={() => printProject("cards")}><Printer size={16} />{t("cards")}</button>
              </article>
            </div>
            <p className="lamination-note">{t("laminateTokens")}</p>
          </section>
        </div>
      )}

      <aside className="sidebar">
        <nav className="tabs" aria-label={t("tools")}>
          <button className={tab === "cards" ? "active" : ""} onClick={() => setTab("cards")}><BookOpen size={17} />{t("cards")}</button>
          <button className={tab === "library" ? "active" : ""} onClick={() => setTab("library")}><ImagePlus size={17} />{t("images")}</button>
          <button className={tab === "design" ? "active" : ""} onClick={() => setTab("design")}><Palette size={17} />{t("style")}</button>
        </nav>

        <div className="sidebar-content">
          {tab === "cards" && (
            <>
              <div className="section-title"><h2>{t("game")}</h2><span>{project.cardCount} {t("cards").toLowerCase()}</span></div>
              <p className="control-intro">{t("setHelp")}</p>
              <div className="two-fields">
                <Field label={t("cards")}><input type="number" min="2" max="60" step="2" value={project.cardCount} onChange={(event) => updateProject({ cardCount: Math.max(2, Number(event.target.value) || 2) })} /><small className="field-help">{t("cardCountHelp")}</small></Field>
                <Field label={t("maxRepeats")}><input type="number" min="1" max="20" value={project.repeatCap} onChange={(event) => updateProject({ repeatCap: Math.max(1, Number(event.target.value) || 1) })} /><small className="field-help">{t("repeatHelp")}</small></Field>
              </div>
              <button className="wide-button" onClick={regenerate}><RefreshCw size={17} />{project.cards.length ? t("regenerate") : t("generate")}</button>
              <p className="capacity">{selectedArtworks.length} {t("selectedImages")} · {t("capacity")} {selectedArtworks.length * project.repeatCap} / {project.cardCount * 12}</p>

              {selected && selectedCell && (
                <div className="cell-editor">
                  <div className="section-title"><h2>{t("selectedCell")}</h2><button className="icon-button small" onClick={() => setSelectedCell(null)}><X size={15} /></button></div>
                  {selected.kind === "number" ? (
                    <Field label={`${t("numberColumn")} ${selectedCell.cellIndex % 9 + 1}`}>
                      <input type="number" value={selected.number} onChange={(event) => editNumber(Number(event.target.value))} />
                    </Field>
                  ) : (
                    <Field label={t("artwork")}>
                      <select value={selected.artworkId} onChange={(event) => replaceCell(event.target.value)}>
                        {selectedArtworks.map((artwork) => <option key={artwork.id} value={artwork.id}>{titleFor(artwork, project.language)}</option>)}
                      </select>
                    </Field>
                  )}
                </div>
              )}

              {project.cards.length > 0 && (
                <div className="validation-list">
                  {project.cards.slice(sheetIndex * 2, sheetIndex * 2 + 2).map((card, index) => {
                    const validation = validateCard(card);
                    return <div key={card.id}><Check size={14} />{t("card")} {sheetIndex * 2 + index + 1}: {validation.valid ? t("valid") : t("check")}</div>;
                  })}
                </div>
              )}
            </>
          )}

          {tab === "library" && (
            <>
              <div className="section-title"><h2>{t("library")}</h2><span>{selectedArtworks.length}/{artworks.length}</span></div>
              <input className="search" type="search" placeholder={t("localSearch")} value={librarySearch} onChange={(event) => setLibrarySearch(event.target.value)} />
              <label className="upload-button"><ImagePlus size={17} />{t("addImage")}<input hidden type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && addArtwork(event.target.files[0])} /></label>
              <div className="online-search">
                <div className="section-title"><h2><Globe2 size={15} /> {t("globalSearch")}</h2><span>Wikimedia Commons</span></div>
                <div className="search-action"><input value={onlineQuery} placeholder={t("globalPlaceholder")} onChange={(event) => setOnlineQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && searchCommons()} /><button onClick={searchCommons}>{t("search")}</button></div>
                {onlineStatus && <p>{onlineStatus}</p>}
                {onlineResults.length > 0 && <div className="online-results">{onlineResults.map((result) => <button key={result.id} onClick={() => importOnlineArtwork(result)} title={`${result.author} · ${result.license}`}><img src={result.imageUrl} alt="" /><span>{result.title}</span><small>{result.license}</small></button>)}</div>}
              </div>
              <div className="library-grid">
                {filteredLibrary.map((artwork) => {
                  const enabled = project.selectedArtworkIds.includes(artwork.id);
                  return (
                    <div data-artwork-id={artwork.id} className={`library-item ${enabled ? "enabled" : ""} ${focusedArtworkId === artwork.id ? "focused" : ""} ${artwork.custom ? "custom" : ""}`} key={artwork.id}>
                      <button className="library-thumb" onClick={() => updateProject({ selectedArtworkIds: enabled ? project.selectedArtworkIds.filter((id) => id !== artwork.id) : [...project.selectedArtworkIds, artwork.id] })}>
                        <img src={artwork.imageUrl} alt="" />
                        <span className="checkmark"><Check size={13} /></span>
                      </button>
                      {artwork.custom ? <div className="custom-fields">
                        <input aria-label={t("title")} placeholder={t("title")} value={titleFor(artwork, project.language)} onChange={(event) => updateArtwork(artwork.id, { titles: { ...artwork.titles, [project.language]: event.target.value } })} />
                        <input aria-label={t("authorSubtitle")} placeholder={t("authorSubtitle")} value={artwork.author} onChange={(event) => updateArtwork(artwork.id, { author: event.target.value })} />
                        <input aria-label={t("year")} placeholder={t("year")} value={artwork.year} onChange={(event) => updateArtwork(artwork.id, { year: event.target.value })} />
                      </div> : <span>{titleFor(artwork, project.language)}</span>}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {tab === "design" && (
            <>
              <div className="section-title"><h2>{t("style")}</h2><Settings2 size={16} /></div>
              <div className="color-grid">
                {([
                  ["cardBackground", "cardColor"], ["cellBackground", "cellColor"], ["border", "borderColor"],
                  ["numbers", "numberColor"], ["titles", "titleColor"], ["details", "metaColor"],
                ] as Array<[MessageKey, keyof DesignSettings]>).map(([label, key]) => (
                  <Field label={t(label)} key={key}><input type="color" value={String(project.design[key])} onChange={(event) => updateDesign(key, event.target.value as never)} /></Field>
                ))}
              </div>
              <RangeField label={t("borderWidth")} value={project.design.borderWidthMm} min={0} max={1} step={0.05} unit=" mm" onChange={(value) => updateDesign("borderWidthMm", value)} />
              <Field label={t("cellShape")}><select value={project.design.cellShape} onChange={(event) => {
                const shape = event.target.value as DesignSettings["cellShape"];
                updateDesign("cellShape", shape);
                if (shape !== "square" && project.design.cellRadiusMm < 1) updateDesign("cellRadiusMm", 4);
              }}><option value="square">{t("square")}</option><option value="rounded">{t("rounded")}</option><option value="squircle">{t("squircle")}</option></select></Field>
              {project.design.cellShape !== "square" && <RangeField label={project.design.cellShape === "squircle" ? t("squircleCurve") : t("cellRounding")} value={project.design.cellRadiusMm} min={1} max={10} step={0.5} unit=" mm" onChange={(value) => updateDesign("cellRadiusMm", value)} />}
              <RangeField label={t("cardRounding")} value={project.design.cardRadiusMm} min={0} max={8} step={0.5} unit=" mm" onChange={(value) => updateDesign("cardRadiusMm", value)} />
              <RangeField label={t("gradientOpacity")} value={project.design.gradientOpacity} min={0.2} max={1} step={0.02} onChange={(value) => updateDesign("gradientOpacity", value)} />

              <h3>{t("geometry")}</h3>
              <RangeField label={t("cardPadding")} value={project.design.cardPaddingMm} min={0} max={5} step={0.5} unit=" mm" onChange={(value) => updateDesign("cardPaddingMm", value)} />
              <RangeField label={t("horizontalMargin")} value={project.design.pageMarginXmm} min={5} max={13} step={0.5} unit=" mm" onChange={(value) => updateDesign("pageMarginXmm", value)} />
              <RangeField label={t("verticalMargin")} value={project.design.pageMarginYmm} min={3} max={10} step={0.5} unit=" mm" onChange={(value) => updateDesign("pageMarginYmm", value)} />
              <RangeField label={t("cutGap")} value={project.design.centerGapMm} min={0} max={8} step={0.5} unit=" mm" onChange={(value) => updateDesign("centerGapMm", value)} />
              {fitIssue && <p className="inline-error">{fitIssue}</p>}

              <h3>{t("typography")}</h3>
              {(["numberFont", "titleFont", "metaFont"] as const).map((key) => (
                <Field label={key === "numberFont" ? t("numbers") : key === "titleFont" ? t("titles") : t("details")} key={key}>
                  <input list="font-list" value={project.design[key]} onChange={(event) => updateDesign(key, event.target.value)} />
                </Field>
              ))}
              <datalist id="font-list">{GOOGLE_FONTS.map((font) => <option value={font} key={font} />)}</datalist>
              <RangeField label={t("numberSize")} value={project.design.numberFontSizePt} min={20} max={48} unit=" pt" onChange={(value) => updateDesign("numberFontSizePt", value)} />
              <RangeField label={t("titleSize")} value={project.design.titleFontSizePt} min={5} max={12} step={0.2} unit=" pt" onChange={(value) => updateDesign("titleFontSizePt", value)} />
              <RangeField label={t("detailSize")} value={project.design.metaFontSizePt} min={3.5} max={8} step={0.1} unit=" pt" onChange={(value) => updateDesign("metaFontSizePt", value)} />

              <h3>{t("ornament")}</h3>
              <Field label={t("motif")}><select value={project.design.ornament} onChange={(event) => updateDesign("ornament", event.target.value as DesignSettings["ornament"])}><option value="none">{t("none")}</option><option value="corner">{t("corners")}</option><option value="frame">{t("doubleFrame")}</option><option value="pattern">{t("subtlePattern")}</option><option value="custom">{t("customImage")}</option></select></Field>
              <RangeField label={t("opacity")} value={project.design.ornamentOpacity} min={0.05} max={0.6} step={0.01} onChange={(value) => updateDesign("ornamentOpacity", value)} />
              <RangeField label={t("scale")} value={project.design.ornamentScale} min={0.5} max={2} step={0.05} onChange={(value) => updateDesign("ornamentScale", value)} />
              <Field label={t("color")}><input type="color" value={project.design.ornamentColor} onChange={(event) => updateDesign("ornamentColor", event.target.value)} /></Field>
              <label className="upload-button"><Upload size={16} />{t("importOrnament")}<input hidden type="file" accept="image/*" onChange={async (event) => event.target.files?.[0] && updateDesign("customOrnament", await readFileAsDataUrl(event.target.files[0]))} /></label>
            </>
          )}
        </div>
      </aside>

      <main className="workspace">
        {error && <div className="error-banner"><span>{error}</span><button onClick={() => setError(null)}><X size={15} /></button></div>}
        <div className="preview-toolbar">
          <div className="preview-modes"><button className={previewMode === "cards" ? "active" : ""} onClick={() => setPreviewMode("cards")}><Grid3X3 size={15} />{t("cards")}</button><button className={previewMode === "tokens" ? "active" : ""} onClick={() => setPreviewMode("tokens")}><Tags size={15} />{t("titledTokens")}</button></div>
          <span>{t("landscapeInfo")}</span>
          {previewMode === "cards" && sheets.length > 0 && <div className="pager"><button disabled={sheetIndex === 0} onClick={() => { setSheetIndex((value) => value - 1); setSelectedCell(null); }}><ChevronLeft size={16} /></button><span>{t("sheet")} {sheetIndex + 1} / {sheets.length}</span><button disabled={sheetIndex >= sheets.length - 1} onClick={() => { setSheetIndex((value) => value + 1); setSelectedCell(null); }}><ChevronRight size={16} /></button></div>}
          {previewMode === "tokens" && <div className="pager"><button disabled={tokenPageIndex === 0} onClick={() => setTokenPageIndex((value) => value - 1)}><ChevronLeft size={16} /></button><span>{t("sheet")} {tokenPageIndex + 1} / {tokenPages.length}</span><button disabled={tokenPageIndex >= tokenPages.length - 1} onClick={() => setTokenPageIndex((value) => value + 1)}><ChevronRight size={16} /></button></div>}
        </div>
        {previewMode === "tokens" ? (
          <div className="token-a4-preview">
            <div className="token-grid">
              {tokenPages[tokenPageIndex]?.map((item, index) => <TokenView key={item.artwork?.id || item.number || index} number={item.number} artwork={item.artwork} language={project.language} design={project.design} onArtworkClick={focusArtwork} />)}
            </div>
          </div>
        ) : sheets.length ? (
          <div className="a4-preview" style={{ padding: `${project.design.pageMarginYmm}mm ${project.design.pageMarginXmm}mm`, gap: `${project.design.centerGapMm}mm` }}>
            {sheets[sheetIndex]?.map((card, index) => <CardView key={card.id} card={card} cardIndex={sheetIndex * 2 + index} artworks={artworkMap} project={project} selectedCell={selectedCell} onSelect={(selection) => {
              setSelectedCell(selection);
              if (!selection) return;
              const cell = project.cards[selection.cardIndex]?.cells[selection.cellIndex];
              if (cell?.kind === "art") focusArtwork(cell.artworkId);
            }} />)}
          </div>
        ) : (
          <WelcomeScreen t={t} onGenerate={regenerate} />
        )}
      </main>

      <div className="print-root">
        {printMode === "cards" ? sheets.map((sheet, pageIndex) => (
          <section className="print-page" key={pageIndex} style={{ padding: `${project.design.pageMarginYmm}mm ${project.design.pageMarginXmm}mm`, gap: `${project.design.centerGapMm}mm` }}>
            {sheet.map((card, index) => <CardView key={card.id} card={card} cardIndex={pageIndex * 2 + index} artworks={artworkMap} project={project} selectedCell={null} />)}
          </section>
        )) : tokenPages.map((items, pageIndex) => (
          <section className="token-print-page" key={pageIndex}>
            <div className="token-grid">
              {items.map((item, index) => <TokenView key={item.artwork?.id || item.number || index} number={item.number} artwork={item.artwork} language={project.language} design={project.design} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default App;
