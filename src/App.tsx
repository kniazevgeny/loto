import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Tags,
  X,
} from "lucide-react";
import { createDefaultProject, defaultDesign } from "./defaults";
import { loadLatestProject, saveProject } from "./db";
import { prepareFonts } from "./fonts";
import { generateCards, requiredArtworkPlacements } from "./generator";
import { exportProjectFile, loadBuiltinLibrary, readFileAsDataUrl } from "./library";
import { tr, type MessageKey } from "./i18n";
import type { Artwork, Card, Cell, DesignSettings, Project } from "./types";
import { CardView, TokenView, WelcomeScreen, titleFor, type SelectedCell } from "./components/LotoViews";
import { AppHeader, MobileWelcome, PrintDialog } from "./components/AppChrome";
import { Sidebar, type OnlineArtwork, type SidebarModel, type Tab } from "./components/Sidebar";

type PrintMode = "cards" | "tokens";
type PreviewMode = "cards" | "tokens";

interface TokenItem {
  number?: number;
  artwork?: Artwork;
}

const COLUMN_RANGES: Array<[number, number]> = [
  [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
  [50, 59], [60, 69], [70, 79], [80, 90],
];

function stripHtml(value = "") {
  const element = document.createElement("div");
  element.innerHTML = value;
  return element.textContent?.trim() || "";
}

function loadAspectRatio(imageUrl: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : undefined);
    image.onerror = () => resolve(undefined);
    image.src = imageUrl;
  });
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
  const [isGenerating, setIsGenerating] = useState(false);
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
  const requiredArtPlacements = requiredArtworkPlacements(project.cardCount, project.bentoEnabled);
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
        next.bentoEnabled ??= true;
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

  const regenerate = async () => {
    setError(null);
    setIsGenerating(true);
    setStatus(t("measuringImages"));
    const preparedArtworks = await Promise.all(selectedArtworks.map(async (artwork) => (
      artwork.aspectRatio ? artwork : { ...artwork, aspectRatio: await loadAspectRatio(artwork.imageUrl) }
    )));
    const measuredRatios = new Map(preparedArtworks.flatMap((artwork) => artwork.aspectRatio ? [[artwork.id, artwork.aspectRatio] as const] : []));
    setBuiltin((current) => current.map((artwork) => measuredRatios.has(artwork.id) ? { ...artwork, aspectRatio: measuredRatios.get(artwork.id) } : artwork));
    setProject((current) => ({
      ...current,
      customArtworks: current.customArtworks.map((artwork) => measuredRatios.has(artwork.id) ? { ...artwork, aspectRatio: measuredRatios.get(artwork.id) } : artwork),
    }));
    const nextSeed = project.seed + 1;
    const result = generateCards(project.cardCount, preparedArtworks, project.repeatCap, nextSeed, project.bentoEnabled);
    if (result.issue) {
      setError(`${t("libraryInsufficient")} ${result.issue.additionalImagesNeeded} ${t("imagesNeeded")} ${result.issue.minimumImages}.`);
      setIsGenerating(false);
      return;
    }
    updateProject({ cards: result.cards, seed: nextSeed });
    setSheetIndex(0);
    setSelectedCell(null);
    setStatus(`${result.cards.length} ${t("cardsGenerated")}`);
    setIsGenerating(false);
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

  const resizeArtwork = (cardIndex: number, cellIndex: number, colSpan: 1 | 2, rowSpan: 1 | 2) => {
    const card = project.cards[cardIndex];
    const owner = card?.cells[cellIndex];
    if (!card || owner?.kind !== "art") return;
    const originRow = Math.floor(cellIndex / 9);
    const originColumn = cellIndex % 9;
    if (originColumn + colSpan > 9 || originRow + rowSpan > 3) {
      setError(t("resizeBlocked"));
      return;
    }

    const usedArtworkIds = new Set(
      card.cells.flatMap((cell, index) => cell.kind === "art" && index !== cellIndex ? [cell.artworkId] : []),
    );
    const replacements = selectedArtworks.filter((artwork) => !usedArtworkIds.has(artwork.id) && artwork.id !== owner.artworkId);
    let replacementIndex = 0;
    const baseCells: Cell[] = card.cells.map((cell) => {
      if (cell.kind !== "covered" || cell.ownerIndex !== cellIndex) return cell;
      const replacement = cell.artworkId || replacements[replacementIndex++]?.id || owner.artworkId;
      usedArtworkIds.add(replacement);
      return { kind: "art", artworkId: replacement };
    });

    const targetIndexes = new Set<number>();
    for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
      for (let columnOffset = 0; columnOffset < colSpan; columnOffset += 1) {
        targetIndexes.add((originRow + rowOffset) * 9 + originColumn + columnOffset);
      }
    }

    const blocked = [...targetIndexes].some((index) => {
      if (index === cellIndex) return false;
      const cell = baseCells[index];
      return cell.kind !== "art" || (cell.colSpan || 1) > 1 || (cell.rowSpan || 1) > 1;
    });
    if (blocked) {
      setError(t("resizeBlocked"));
      return;
    }

    if (colSpan === 2 && rowSpan === 2) {
      const tooClose = baseCells.some((cell, index) => {
        if (index === cellIndex || cell.kind !== "art" || (cell.colSpan || 1) !== 2 || (cell.rowSpan || 1) !== 2) return false;
        const row = Math.floor(index / 9);
        const column = index % 9;
        return originColumn - 1 <= column + 1
          && originColumn + 2 >= column
          && originRow - 1 <= row + 1
          && originRow + 2 >= row;
      });
      if (tooClose) {
        setError(t("resizeTooClose"));
        return;
      }
    }

    const nextCells = baseCells.map((cell, index): Cell => {
      if (index === cellIndex) return { kind: "art", artworkId: owner.artworkId, colSpan, rowSpan };
      if (!targetIndexes.has(index)) return cell;
      return { kind: "covered", ownerIndex: cellIndex, artworkId: cell.kind === "art" ? cell.artworkId : undefined };
    });
    setError(null);
    updateProject({
      cards: project.cards.map((candidate, index) => index === cardIndex ? { ...candidate, cells: nextCells } : candidate),
    });
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
      aspectRatio: await loadAspectRatio(imageUrl),
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

  const importOnlineArtwork = async (result: OnlineArtwork) => {
    if (project.customArtworks.some((item) => item.id === result.id)) return;
    const aspectRatio = await loadAspectRatio(result.imageUrl);
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
      aspectRatio,
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
      data.bentoEnabled ??= true;
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
  const sidebarModel: SidebarModel = {
    navigation: { tab, setTab, sheetIndex },
    project: { value: project, update: updateProject, updateDesign },
    generation: { isGenerating, regenerate, selectedArtworks, requiredArtPlacements },
    selection: { selected, selectedCell, setSelectedCell, replaceCell, resizeArtwork, editNumber },
    library: {
      artworks, filteredLibrary, search: librarySearch, setSearch: setLibrarySearch,
      focusedArtworkId, addArtwork, updateArtwork, onlineQuery, setOnlineQuery,
      onlineStatus, onlineResults, searchCommons, importOnlineArtwork,
    },
    fitIssue,
    t,
  };

  return (
    <div className="app-shell">
      <MobileWelcome project={project} updateProject={updateProject} t={t} onGenerate={regenerate} />
      <AppHeader
        project={project}
        status={status}
        importRef={importRef}
        updateProject={updateProject}
        onImport={handleImport}
        onExport={() => exportProjectFile(project, project.name)}
        onPrint={() => setPrintDialogOpen(true)}
        t={t}
      />
      <PrintDialog open={printDialogOpen} onClose={() => setPrintDialogOpen(false)} onPrint={printProject} t={t} />
      <Sidebar model={sidebarModel} />

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
            {sheets[sheetIndex]?.map((card, index) => <CardView key={card.id} card={card} cardIndex={sheetIndex * 2 + index} artworks={artworkMap} project={project} selectedCell={selectedCell} onResize={resizeArtwork} onSelect={(selection) => {
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
