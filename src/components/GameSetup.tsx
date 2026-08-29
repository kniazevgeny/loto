import type { CSSProperties } from "react";
import { formatDuration } from "../game/queue";
import { estimateQueueDuration, tokenDurationMs } from "../game/timing";
import { fasterSeconds, formatSeconds, MAX_PACE_SLIDER_VALUE, secondsFromSliderValue, sliderValueFromSeconds, slowerSeconds } from "../game/pace";
import type { GameSetup as GameSetupValues, GameToken, GameTokenSummary } from "../game/types";
import type { OfflinePreparation } from "../game/offline";
import type { MessageKey } from "../i18n";
import { Minus, Plus } from "lucide-react";
import { GameSpeedometer } from "./GameSpeedometer";

type Translate = (key: MessageKey) => string;

const languages = ["en", "fr", "ru"] as const;

export function GameSetup({
  setup, summary, previewQueue, language, interfaceLanguage, offline, t, onChange, onInterfaceLanguageChange, onStart,
}: {
  setup: GameSetupValues;
  summary: GameTokenSummary;
  previewQueue: GameToken[];
  language: string;
  interfaceLanguage: string;
  offline: OfflinePreparation;
  t: Translate;
  onChange: (patch: Partial<GameSetupValues>) => void;
  onInterfaceLanguageChange: (language: string) => void;
  onStart: () => void;
}) {
  const paceSliderValue = sliderValueFromSeconds(setup.secondsPerToken);

  const toggleLanguage = (nextLanguage: string) => {
    const selected = setup.languages.includes(nextLanguage);
    if (selected && setup.languages.length === 1) return;
    onChange({ languages: selected ? setup.languages.filter((item) => item !== nextLanguage) : [...setup.languages, nextLanguage] });
  };

  return (
    <main className="game-page game-setup-page">
      <header className="game-setup-header">
        <a className="game-brand" href={`${import.meta.env.BASE_URL}game/?set=default`}>Loto Art Studio</a>
        <div className="game-interface-language" role="group" aria-label={t("language")}>
          {languages.map((item) => <button type="button" key={item} className={interfaceLanguage === item ? "active" : ""} aria-pressed={interfaceLanguage === item} onClick={() => onInterfaceLanguageChange(item)}>{item.toUpperCase()}</button>)}
        </div>
      </header>
      <section className="game-setup" aria-labelledby="game-setup-title">
        <h1 id="game-setup-title">{t("gameSetup")}</h1>
        <div className="game-setup-primary">
          <div className="game-field">
            <span>{t("gameLanguages")}</span>
            <p className="game-field-help">{t("gameLanguagesHelp")}</p>
            <div className="game-tags" role="group" aria-label={t("gameLanguages")}>
              {languages.map((item) => (
                <button key={item} className={setup.languages.includes(item) ? "active" : ""} type="button" aria-pressed={setup.languages.includes(item)} onClick={() => toggleLanguage(item)}>
                  <span>{setup.languages.includes(item) ? "✓" : ""}</span>{item === "en" ? "English" : item === "fr" ? "Français" : "Русский"}
                </button>
              ))}
            </div>
          </div>
          <div className="game-field game-pace-field">
            <span>{t("gameSpeed")}</span>
            <div className="game-slider-row">
              <button type="button" aria-label={t("slower")} onClick={() => onChange({ secondsPerToken: slowerSeconds(setup.secondsPerToken) })}><Minus size={16} /></button>
              <GameSpeedometer seconds={setup.secondsPerToken} />
              <input type="range" min="0" max={MAX_PACE_SLIDER_VALUE} step="1" value={paceSliderValue} style={{ "--pace-fill": (paceSliderValue / MAX_PACE_SLIDER_VALUE).toFixed(4) } as CSSProperties} onChange={(event) => onChange({ secondsPerToken: secondsFromSliderValue(Number(event.target.value)) })} aria-label={t("gameSpeed")} />
              <button type="button" aria-label={t("faster")} onClick={() => onChange({ secondsPerToken: fasterSeconds(setup.secondsPerToken) })}><Plus size={16} /></button>
            </div>
            <output className="game-tempo-value">{t("artworkDuration")} {formatSeconds(setup.secondsPerToken, language)} {t("secondsShort")} · {t("numberDuration")} {formatSeconds(tokenDurationMs({ kind: "number", number: 1 }, setup.secondsPerToken * 1000) / 1000, language)} {t("secondsShort")}</output>
          </div>
        </div>
        <div className="game-token-summary">
          <span>{t("gameArtworks")}: <strong>{summary.artworks}</strong></span>
          <span>{t("gameNumbers")}: <strong>{setup.includeAllNumbers ? 90 : summary.numbers}</strong></span>
          <span>{t("estimatedDuration")} <strong>{formatDuration(estimateQueueDuration(previewQueue, setup.secondsPerToken * 1000) / 1000, language)}</strong></span>
        </div>
        {summary.numbers < 90 && <label className="game-option">
          <input type="checkbox" checked={setup.includeAllNumbers} onChange={(event) => onChange({ includeAllNumbers: event.target.checked })} />
          <span><strong>{t("addNumbers")}: +{90 - summary.numbers}</strong><small>{t("gameReplaceNumbers")}</small></span>
        </label>}
        {offline.state !== "idle" && <div className={`game-offline-status ${offline.state}`} aria-live="polite">
          {offline.state === "preparing" ? `${t("offlinePreparing")} ${offline.completed}/${offline.total}` : offline.state === "ready" ? t("offlineReady") : offline.state === "unsupported" ? t("offlineUnavailable") : t("offlineFailed")}
        </div>}
        {summary.total ? <>
          <button className="game-start" type="button" onClick={onStart} disabled={offline.state === "preparing"}>{t("startGame")}</button>
          {offline.state === "preparing" && <button className="game-offline-bypass" type="button" onClick={onStart}>{t("startWithoutOffline")}</button>}
        </> : (
          <div className="game-empty"><p>{t("noGameTokens")}</p><a href={import.meta.env.BASE_URL}>{t("backToEditor")}</a></div>
        )}
      </section>
    </main>
  );
}
