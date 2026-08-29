import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalog = JSON.parse(readFileSync(new URL("../app-public/library/library.json", import.meta.url), "utf8"));
const defaultsSource = readFileSync(new URL("../src/defaults.ts", import.meta.url), "utf8");
const byId = new Map(catalog.map((item) => [item.id, item]));

const expectedSources = {
  "commons-portrait-arnolfini": "Van_Eyck_-_Arnolfini_Portrait.jpg",
  "commons-le-printemps": "Primavera_by_Botticelli.jpg",
  "commons-l-cole-d-athnes": "The_School_of_Athens_by_Raffaello_Sanzio_da_Urbino_in_Vatican.jpg",
  "commons-la-transfiguration": "Transfiguration_Raphael.jpg",
  "commons-la-grande-odalisque": "La_Grande_Odalisque_-_Jean-Auguste-Dominique_Ingres_-_Mus%C3%A9e_du_Louvre_Peintures_RF_1158.jpg",
  "commons-voyageur-contemplant-une-mer-de-nuages": "Caspar_David_Friedrich_-_Wanderer_above_the_Sea_of_Fog.jpeg",
  "met-441357": "The_Great_Pyramid_of_Giza.jpg",
  "met-12266": "Central_nave%2C_two_of_the_semidomes_and_three_of_the_archs_where_the_main_dome_rests_on_-_Hagia_Sophia_%288396671116%29.jpg",
  "met-253370": "Michelangelo%2C_David.jpg",
  "met-544450": "Venus_de_Milo_-_full_view.jpg",
  "met-75414": "Discobolus_Lancelotti_Massimo.jpg",
  "met-318622": "Mo%C3%A1is.jpg",
  "met-195733": "Great_Sphinx_of_Giza_%28%D8%A3%D8%A8%D9%88_%D8%A7%D9%84%D9%87%D9%88%D9%84%29.jpg",
  "cc0-borobudur": "Borobudur_stupas_on_upper_terrace.jpg",
  "pd-angkor-wat": "Angkor_Wat_reflejado_en_un_estanque_08.jpg",
};

for (const [id, sourceFragment] of Object.entries(expectedSources)) {
  const item = byId.get(id);
  assert(item, `Missing catalog item: ${id}`);
  assert(item.sourceUrl.includes(sourceFragment), `${id} does not use the reviewed source`);
}

assert.equal(byId.get("commons-portrait-arnolfini")?.titles.en, "The Arnolfini Portrait");
assert.equal(byId.has("commons-la-dame-l-hermine"), false);
assert.match(defaultsSource, /cardImageFit:\s*"cover"/, "New projects must fill playing-card cells by default");

for (const id of [
  "commons-la-transfiguration",
  "commons-la-grande-odalisque",
  "met-253370",
  "met-544450",
  "met-75414",
]) {
  assert.equal(byId.get(id)?.playingFit, "contain", `${id} must remain fully visible on playing cards`);
}

console.log("Library image sources and crop policies are valid.");
