import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const baseGameStyles = css.slice(css.indexOf("body:has(.game-page)"), css.indexOf("@media (max-width: 600px)"));

if (!/body:has\(\.game-page\)\s*\{[^}]*min-width:\s*0/.test(baseGameStyles)) {
  throw new Error("The game route must override the editor's 1024px body minimum at every viewport width.");
}
const stageRule = css.match(/\.game-stage-page \{([^}]*)\}/)?.[1] ?? "";

if (/grid-template-rows/.test(stageRule)) {
  throw new Error("The stage must not reserve fixed grid rows around the playable area.");
}

if (!/display:\s*grid/.test(stageRule) || !/place-items:\s*center/.test(stageRule)) {
  throw new Error("The stage must center its playable area without a fixed row layout.");
}

const pauseRule = css.match(/\.game-controls \.game-pause \{([^}]*)\}/)?.[1] ?? "";
if (!/width:\s*56px/.test(pauseRule) || !/height:\s*56px/.test(pauseRule)) {
  throw new Error("The pause control must be the clearly dominant dock action.");
}

const numberRule = css.match(/\.game-number \{([^}]*)\}/)?.[1] ?? "";
if (!/letter-spacing:\s*-0\.02em/.test(numberRule)) {
  throw new Error("Large in-game numbers must use the requested compact tracking.");
}

const setupRule = css.match(/\.game-setup \{([^}]*)\}/)?.[1] ?? "";
if (!/width:\s*min\(100%, 460px\)/.test(setupRule)) {
  throw new Error("The setup must retain its compact single-column measure.");
}

if (/\.game-setup\s*\{[^}]*680px/.test(css)) {
  throw new Error("Responsive rules must not widen the compact game setup.");
}

const languageRule = css.match(/\.game-tags \{([^}]*)\}/)?.[1] ?? "";
if (!/display:\s*flex/.test(languageRule)) {
  throw new Error("Language choices must use compact chips rather than a card grid.");
}

const landscapeRule = css.match(/\.game-token > img\.landscape \{([^}]*)\}/)?.[1] ?? "";
if (!/object-fit:\s*contain/.test(landscapeRule)) {
  throw new Error("Ordinary landscape artwork must preserve the full image.");
}

const portraitRules = [...css.matchAll(/\.game-token > img\.portrait \{([^}]*)\}/g)].map((match) => match[1]);
if (!portraitRules.length || portraitRules.some((rule) => /(?:^|;)\s*height:\s*min\(/.test(rule))) {
  throw new Error("Portrait artwork must not use a fixed-height box around contained pixels.");
}
if (!portraitRules.every((rule) => /max-height:\s*(?:min\(|\d+vh)/.test(rule))) {
  throw new Error("Every portrait breakpoint must cap size with max-height.");
}

const speedOutputRule = css.match(/\.game-speed-popover output \{([^}]*)\}/)?.[1] ?? "";
if (!/white-space:\s*nowrap/.test(speedOutputRule)) {
  throw new Error("The in-game pace value and unit must stay on one line.");
}

const mobileMedia = css.match(/@media \(max-width: 600px\) \{([\s\S]*?)\n\}/)?.[1] ?? "";
if (!/\.game-speed-control\s*\{[^}]*right:\s*14px[^}]*bottom:\s*26px/s.test(mobileMedia)) {
  throw new Error("The mobile speed control must vertically align with the centered Pause dock.");
}

if (/@media \(max-width: 600px\),[^}]*\.game-playback-dock/s.test(css)) {
  throw new Error("Mobile speed alignment must not horizontally regroup the controls.");
}

if (!/\.game-token > img\.is-ready\s*\{\s*animation:\s*game-image-fade \.5s[^;]*,\s*game-token-scale var\(--token-duration\) linear both/s.test(css)) {
  throw new Error("Artwork must fade in, then scale across the full token duration.");
}
if (!/\.game-number\s*\{\s*animation:[^;]*game-token-scale var\(--token-duration\) linear both/s.test(css)) {
  throw new Error("Numbers must scale across their shorter token duration.");
}
if (!/@keyframes game-token-scale\s*\{\s*from\s*\{[^}]*scale\(1\)[^}]*\}\s*to\s*\{[^}]*scale\(1\.05\)/s.test(css)) {
  throw new Error("Tokens must slowly scale from 1 to 1.05.");
}
if (/\.game-token > img, \.game-number/.test(css)) {
  throw new Error("Artwork must not inherit the generic upward token motion.");
}
if (!/\.game-stage-page\.is-paused \.game-token > img,\s*\.game-stage-page\.is-paused \.game-number\s*\{[^}]*animation-play-state:\s*running,\s*paused/s.test(css)) {
  throw new Error("Pausing must stop token scaling without freezing entrances at zero opacity.");
}
if (!/\.game-art-labels\.is-ready\s*\{[^}]*animation:[^;]*10ms both/s.test(css)) {
  throw new Error("Artwork labels must enter 10ms after the image load signal.");
}
if (!/\.game-number-labels\s*\{[^}]*animation:[^;]*10ms both/s.test(css)) {
  throw new Error("Number labels must enter 10ms after the number renders.");
}

console.log("Game stage layout checks passed.");
