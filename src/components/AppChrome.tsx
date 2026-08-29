import type { RefObject } from "react";
import { Download, Grid3X3, Languages, Play, Printer, Save, Tags, Upload, X } from "lucide-react";
import type { MessageKey } from "../i18n";
import type { Project } from "../types";
import { SegmentedControl } from "./Controls";
import { WelcomeScreen } from "./LotoViews";

type Translate = (key: MessageKey) => string;

export function MobileWelcome({
  project, updateProject, t, onGenerate,
}: {
  project: Project;
  updateProject: (patch: Partial<Project>) => void;
  t: Translate;
  onGenerate: () => void;
}) {
  return (
    <section className="mobile-welcome">
      <div className="mobile-header">
        <div className="mobile-brand"><Grid3X3 size={20} /><span>Loto Art Studio</span></div>
        <div className="mobile-language" role="group" aria-label={t("language")}>
          {(["en", "fr", "ru"] as const).map((language) => (
            <button type="button" className={project.language === language ? "active" : ""} key={language} onClick={() => updateProject({ language })}>
              {language.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <WelcomeScreen t={t} onGenerate={onGenerate} />
    </section>
  );
}

export function AppHeader({
  project, status, importRef, updateProject, onImport, onExport, onPrint, t,
}: {
  project: Project;
  status: string;
  importRef: RefObject<HTMLInputElement | null>;
  updateProject: (patch: Partial<Project>) => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onPrint: () => void;
  t: Translate;
}) {
  return (
    <header className="app-header">
      <div className="brand"><Grid3X3 size={19} /><span>Loto Art Studio</span></div>
      <input className="project-name" value={project.name} onChange={(event) => updateProject({ name: event.target.value })} aria-label={t("projectName")} />
      <span className="save-state"><Save size={14} />{status}</span>
      <div className="header-language">
        <Languages size={16} />
        <SegmentedControl
          value={project.language}
          options={[{ value: "fr", label: "FR" }, { value: "en", label: "EN" }, { value: "ru", label: "RU" }]}
          onChange={(language) => updateProject({ language })}
          ariaLabel={t("language")}
          compact
        />
      </div>
      <button className="icon-button" title={t("importProject")} onClick={() => importRef.current?.click()}><Upload size={18} /></button>
      <input ref={importRef} hidden type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && onImport(event.target.files[0])} />
      <button className="icon-button" title={t("exportProject")} onClick={onExport}><Download size={18} /></button>
      <a className="header-action" href={`${import.meta.env.BASE_URL}game?set=default`}><Play size={15} />{t("play")}</a>
      <button className="primary-button" onClick={onPrint}><Printer size={17} />{t("print")}</button>
    </header>
  );
}

export function PrintDialog({
  open, onClose, onPrint, t,
}: {
  open: boolean;
  onClose: () => void;
  onPrint: (mode: "cards" | "tokens") => void;
  t: Translate;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="print-dialog" role="dialog" aria-modal="true" aria-labelledby="print-dialog-title">
        <div className="dialog-header">
          <div><h2 id="print-dialog-title">{t("printSet")}</h2><p>{t("printBoth")}</p></div>
          <button className="icon-button" title="Close" onClick={onClose}><X size={17} /></button>
        </div>
        <div className="print-steps">
          <article className="print-step">
            <div className="step-icon"><Tags size={20} /></div>
            <div className="step-copy"><h3>{t("tokenStep")}</h3><p>{t("tokenStepHelp")}</p></div>
            <button className="wide-button" onClick={() => onPrint("tokens")}><Printer size={16} />{t("titledTokens")}</button>
          </article>
          <article className="print-step">
            <div className="step-icon"><Grid3X3 size={20} /></div>
            <div className="step-copy"><h3>{t("cardStep")}</h3><p>{t("cardStepHelp")}</p></div>
            <button className="wide-button" onClick={() => onPrint("cards")}><Printer size={16} />{t("cards")}</button>
          </article>
        </div>
        <p className="lamination-note">{t("laminateTokens")}</p>
      </section>
    </div>
  );
}
