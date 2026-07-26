import { BookOpen, Check, Globe2, ImagePlus, Palette, RefreshCw, Settings2, Upload, X } from "lucide-react";
import { GOOGLE_FONTS } from "../defaults";
import { validateCard } from "../generator";
import { type MessageKey } from "../i18n";
import { readFileAsDataUrl } from "../library";
import type { Artwork, Cell, DesignSettings, Project } from "../types";
import { Field, RangeField, SegmentedControl } from "./Controls";
import { titleFor, type SelectedCell } from "./LotoViews";

export type Tab = "cards" | "library" | "design";

export interface OnlineArtwork {
  id: string;
  title: string;
  imageUrl: string;
  sourceUrl: string;
  author: string;
  year: string;
  license: string;
}

export interface SidebarModel {
  navigation: {
    tab: Tab;
    setTab: (tab: Tab) => void;
    sheetIndex: number;
  };
  project: {
    value: Project;
    update: (patch: Partial<Project>) => void;
    updateDesign: <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => void;
  };
  generation: {
    isGenerating: boolean;
    regenerate: () => void;
    selectedArtworks: Artwork[];
    requiredArtPlacements: number;
  };
  selection: {
    selected: Cell | null;
    selectedCell: SelectedCell;
    setSelectedCell: (cell: SelectedCell) => void;
    replaceCell: (artworkId: string) => void;
    resizeArtwork: (cardIndex: number, cellIndex: number, columns: 1 | 2, rows: 1 | 2) => void;
    editNumber: (value: number) => void;
  };
  library: {
    artworks: Artwork[];
    filteredLibrary: Artwork[];
    search: string;
    setSearch: (value: string) => void;
    focusedArtworkId: string | null;
    addArtwork: (file: File) => void;
    updateArtwork: (id: string, patch: Partial<Artwork>) => void;
    onlineQuery: string;
    setOnlineQuery: (value: string) => void;
    onlineStatus: string;
    onlineResults: OnlineArtwork[];
    searchCommons: () => void;
    importOnlineArtwork: (result: OnlineArtwork) => void;
  };
  fitIssue: string | null;
  t: (key: MessageKey) => string;
}

export function Sidebar({ model }: { model: SidebarModel }) {
  const {
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
  } = model;

  return (
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
            <label className="switch-row">
              <span><strong>{t("bentoLayout")}</strong><small>{t("bentoHelp")}</small></span>
              <input type="checkbox" checked={project.bentoEnabled} onChange={(event) => updateProject({ bentoEnabled: event.target.checked })} />
            </label>
            <button className="wide-button" disabled={isGenerating} onClick={regenerate}><RefreshCw size={17} />{isGenerating ? t("measuringImages") : project.cards.length ? t("regenerate") : t("generate")}</button>
            <p className="capacity">{selectedArtworks.length} {t("selectedImages")} · {t("capacity")} {selectedArtworks.length * project.repeatCap} / {requiredArtPlacements}</p>

            {selected && selectedCell && (
              <div className="cell-editor">
                <div className="section-title"><h2>{t("selectedCell")}</h2><button className="icon-button small" onClick={() => setSelectedCell(null)}><X size={15} /></button></div>
                {selected.kind === "number" ? (
                  <Field label={`${t("numberColumn")} ${selectedCell.cellIndex % 9 + 1}`}>
                    <input type="number" value={selected.number} onChange={(event) => editNumber(Number(event.target.value))} />
                  </Field>
                ) : selected.kind === "art" ? (
                  <>
                    <Field label={t("artwork")}>
                      <select value={selected.artworkId} onChange={(event) => replaceCell(event.target.value)}>
                        {selectedArtworks.map((artwork) => <option key={artwork.id} value={artwork.id}>{titleFor(artwork, project.language)}</option>)}
                      </select>
                    </Field>
                    <Field label={t("artworkSize")}>
                      <SegmentedControl
                        value={`${selected.colSpan || 1}x${selected.rowSpan || 1}`}
                        options={[
                          { value: "1x1", label: "1×1" },
                          { value: "2x1", label: `2×1 · ${t("horizontal")}` },
                          { value: "1x2", label: `1×2 · ${t("vertical")}` },
                          { value: "2x2", label: "2×2" },
                        ]}
                        onChange={(value) => {
                          const [columns, rows] = value.split("x").map(Number) as [1 | 2, 1 | 2];
                          resizeArtwork(selectedCell.cardIndex, selectedCell.cellIndex, columns, rows);
                        }}
                        ariaLabel={t("artworkSize")}
                      />
                      <small className="field-help">{t("dragResizeHelp")}</small>
                    </Field>
                  </>
                ) : null}
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
            <Field label={t("cellShape")}><SegmentedControl value={project.design.cellShape} options={[
              { value: "square", label: t("square") },
              { value: "rounded", label: t("rounded") },
              { value: "squircle", label: t("squircle") },
            ]} onChange={(shape) => {
              updateDesign("cellShape", shape);
              if (shape !== "square" && project.design.cellRadiusMm < 1) updateDesign("cellRadiusMm", 4);
            }} ariaLabel={t("cellShape")} /></Field>
            {project.design.cellShape !== "square" && <RangeField label={project.design.cellShape === "squircle" ? t("squircleCurve") : t("cellRounding")} value={project.design.cellRadiusMm} min={1} max={10} step={0.5} unit=" mm" onChange={(value) => updateDesign("cellRadiusMm", value)} />}
            <RangeField label={t("cardRounding")} value={project.design.cardRadiusMm} min={0} max={8} step={0.5} unit=" mm" onChange={(value) => updateDesign("cardRadiusMm", value)} />
            <RangeField label={t("gradientOpacity")} value={project.design.gradientOpacity} min={0.2} max={1} step={0.02} onChange={(value) => updateDesign("gradientOpacity", value)} />
            <Field label={t("playingImageFit")}><SegmentedControl value={project.design.cardImageFit} options={[
              { value: "contain", label: t("fitImage") },
              { value: "cover", label: t("fillCell") },
            ]} onChange={(value) => updateDesign("cardImageFit", value)} ariaLabel={t("playingImageFit")} /><small className="field-help">{t("imageFitHelp")}</small></Field>

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
  );
}
