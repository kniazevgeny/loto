#!/usr/bin/env python3
import json
import re
import shutil
import time
import urllib.parse
import urllib.request
from urllib.error import HTTPError
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COMMONS_SPECS = ROOT / "assets" / "public_library_specs.json"
MET_SPECS = ROOT / "assets" / "met_library_specs.json"
TRANSLATIONS_PATH = ROOT / "assets" / "library_title_translations.json"
SCRATCH_DIR = ROOT / "public" / "library"
OUT_DIR = ROOT / "app-public" / "library"
CATALOG_PATH = OUT_DIR / "library.json"
USER_AGENT = "loto-art-studio/0.1"
LIBERTY_ID = "commons-la-libert-guidant-le-peuple"
LIBERTY_IMAGE_URL = (
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/"
    "La_Libert%C3%A9_guidant_le_peuple_-_Eug%C3%A8ne_Delacroix_-_"
    "Mus%C3%A9e_du_Louvre_Peintures_RF_129_-_apr%C3%A8s_restauration_2024.jpg/"
    "960px-La_Libert%C3%A9_guidant_le_peuple_-_Eug%C3%A8ne_Delacroix_-_"
    "Mus%C3%A9e_du_Louvre_Peintures_RF_129_-_apr%C3%A8s_restauration_2024.jpg"
)
LIBERTY_SOURCE_URL = (
    "https://commons.wikimedia.org/wiki/File:La_Libert%C3%A9_guidant_le_peuple_-_"
    "Eug%C3%A8ne_Delacroix_-_Mus%C3%A9e_du_Louvre_Peintures_RF_129_-_"
    "apr%C3%A8s_restauration_2024.jpg"
)

COMMONS_OVERRIDES = {
    "commons-portrait-arnolfini": {
        "file": "Van Eyck - Arnolfini Portrait.jpg",
        "titles": {
            "fr": "Les Époux Arnolfini",
            "en": "The Arnolfini Portrait",
            "ru": "Портрет четы Арнольфини",
        },
        "author": "Jan van Eyck",
        "year": "1434",
        "license": "Public Domain",
    },
    "commons-le-printemps": {
        "file": "Primavera by Botticelli.jpg",
        "author": "Sandro Botticelli",
        "year": "v. 1480",
        "license": "Public Domain",
    },
    "commons-l-cole-d-athnes": {
        "file": "The School of Athens by Raffaello Sanzio da Urbino in Vatican.jpg",
        "author": "Raphael",
        "year": "1509-1511",
        "license": "Public Domain",
    },
    "commons-la-transfiguration": {
        "file": "Transfiguration Raphael.jpg",
        "author": "Raphael",
        "year": "1516-1520",
        "license": "Public Domain",
        "playingFit": "contain",
    },
    "commons-la-grande-odalisque": {
        "file": "La Grande Odalisque - Jean-Auguste-Dominique Ingres - Musée du Louvre Peintures RF 1158.jpg",
        "author": "Jean-Auguste-Dominique Ingres",
        "year": "1814",
        "license": "Public Domain",
        "playingFit": "contain",
    },
    "commons-voyageur-contemplant-une-mer-de-nuages": {
        "file": "Caspar David Friedrich - Wanderer above the Sea of Fog.jpeg",
        "author": "Caspar David Friedrich",
        "year": "v. 1818",
        "license": "Public Domain",
    },
    "commons-impression-soleil-levant": {
        "file": "Monet - Impression, Sunrise.jpg",
        "author": "Claude Monet",
        "year": "1872",
        "license": "Public Domain",
    },
    "commons-ophlie": {
        "file": "John Everett Millais - Ophelia - Google Art Project.jpg",
        "author": "John Everett Millais",
        "year": "1851-1852",
        "license": "Public Domain",
    },
    "met-282068": {
        "file": "Taj Mahal Front.JPG",
        "author": "Ustad Ahmad Lahori",
        "year": "1632-1653",
        "license": "CC BY-SA 3.0",
    },
    "met-12266": {
        "file": "Central nave, two of the semidomes and three of the archs where the main dome rests on - Hagia Sophia (8396671116).jpg",
        "author": "Architecture byzantine",
        "year": "532-537",
        "license": "CC BY 2.0",
    },
    "met-437244": {
        "file": "Colosseum romanum.jpg",
        "titles": {"fr": "Le Colisee"},
        "author": "Architecture romaine antique",
        "year": "72-80",
        "license": "CC0",
    },
    "met-271707": {
        "file": "Tour Eiffel Wikimedia Commons.jpg",
        "author": "Gustave Eiffel",
        "year": "1887-1889",
        "license": "CC BY-SA 3.0",
    },
    "cc0-borobudur": {
        "file": "Borobudur stupas on upper terrace.jpg",
        "author": "Architecture bouddhique javanaise",
        "year": "IXe siecle",
        "license": "CC BY-SA 4.0",
    },
    "pd-angkor-wat": {
        "file": "Angkor Wat reflejado en un estanque 08.jpg",
        "author": "Architecture khmere",
        "year": "XIIe siecle",
        "license": "CC BY-SA 4.0",
    },
    "met-253370": {
        "file": "Michelangelo, David.jpg",
        "titles": {"fr": "David"},
        "author": "Michel-Ange",
        "year": "1501-1504",
        "license": "CC BY 2.0",
        "playingFit": "contain",
    },
    "met-544450": {
        "file": "Venus de Milo - full view.jpg",
        "titles": {"fr": "Venus de Milo"},
        "author": "Alexandros d'Antioche (attribue)",
        "year": "v. 130-100 av. J.-C.",
        "license": "CC BY-SA 4.0",
        "playingFit": "contain",
    },
    "met-544442": {
        "file": "The Winged Victory of Samothrace.jpg",
        "titles": {"fr": "Victoire de Samothrace"},
        "author": "Art grec hellenistique",
        "year": "v. 190 av. J.-C.",
        "license": "CC BY-SA 4.0",
    },
    "met-255408": {
        "file": "The Thinker, Rodin.jpg",
        "titles": {"fr": "Le Penseur"},
        "author": "Auguste Rodin",
        "year": "1880-1904",
        "license": "Public Domain",
    },
    "met-75414": {
        "file": "Discobolus Lancelotti Massimo.jpg",
        "titles": {"fr": "Discobole"},
        "author": "Myron (d'apres)",
        "year": "v. 450 av. J.-C.",
        "license": "Public Domain",
        "playingFit": "contain",
    },
    "met-318622": {
        "file": "Moáis.jpg",
        "titles": {"fr": "Moai de Rapa Nui"},
        "author": "Culture rapanui",
        "year": "v. 1250-1500",
        "license": "Public Domain",
    },
    "met-310870": {
        "file": "Terracotta warriors.jpg",
        "titles": {"fr": "Guerrier en terre cuite"},
        "author": "Art de la dynastie Qin",
        "year": "IIIe siecle av. J.-C.",
        "license": "CC BY-SA 4.0",
    },
    "met-195733": {
        "file": "Great Sphinx of Giza (أبو الهول).jpg",
        "titles": {"fr": "Grand Sphinx de Gizeh"},
        "author": "Art de l'Egypte antique",
        "year": "v. 2500 av. J.-C.",
        "license": "CC BY-SA 4.0",
    },
    "met-441357": {
        "file": "The Great Pyramid of Giza.jpg",
        "author": "Architecture egyptienne",
        "year": "v. 2560 av. J.-C.",
        "license": "CC BY-SA 4.0",
    },
}

RECOGNIZABLE_IMAGE_IDS = {
    "commons-portrait-arnolfini",
    "commons-le-printemps",
    "commons-l-cole-d-athnes",
    "commons-la-transfiguration",
    "commons-la-grande-odalisque",
    "commons-voyageur-contemplant-une-mer-de-nuages",
    "met-441357",
    "met-12266",
    "met-253370",
    "met-544450",
    "met-75414",
    "met-318622",
    "met-195733",
    "cc0-borobudur",
    "pd-angkor-wat",
}
IMAGE_REVISIONS = {item_id: "recognizable" for item_id in RECOGNIZABLE_IMAGE_IDS}
IMAGE_REVISIONS["commons-portrait-arnolfini"] = "arnolfini"
IMAGE_REVISIONS["met-441357"] = "pyramid-v2"
IMAGE_REVISIONS["met-195733"] = "sphinx-v3"
IMAGE_REVISIONS["cc0-borobudur"] = "borobudur-v3"
IMAGE_REVISIONS["met-318622"] = "moai-v3"
IMAGE_REVISIONS["met-12266"] = "hagia-interior-v3"
IMAGE_REVISIONS["pd-angkor-wat"] = "angkor-v3"


def slugify(value):
    value = value.lower().encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")[:70]


def copy_existing_painting(spec):
    slug = slugify(spec["fr"])
    matches = sorted(SCRATCH_DIR.glob(f"[0-9][0-9]-{slug}.*"))
    if not matches:
        raise FileNotFoundError(f"No cached painting for {spec['fr']}")
    source = matches[0]
    destination = OUT_DIR / f"commons-{slug}{source.suffix.lower()}"
    if not destination.exists():
        shutil.copy2(source, destination)
    return destination


def download(url, destination):
    if destination.exists():
        return
    for attempt in range(5):
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                destination.write_bytes(response.read())
            time.sleep(1)
            return
        except HTTPError as error:
            if error.code != 429 or attempt == 4:
                raise
            time.sleep(2 ** (attempt + 1))


def apply_commons_override(item, spec):
    filename = spec["file"]
    revision = IMAGE_REVISIONS.get(item["id"])
    suffix = f"-{revision}" if revision else ""
    destination = OUT_DIR / f"override-{item['id']}{suffix}.jpg"
    file_url = "https://commons.wikimedia.org/wiki/Special:Redirect/file/" + urllib.parse.quote(filename)
    download(f"{file_url}?width=960", destination)
    item.update({
        "imageUrl": f"./library/{destination.name}",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(filename.replace(" ", "_")),
        "author": spec["author"],
        "year": spec["year"],
        "license": spec["license"],
    })
    if spec.get("playingFit"):
        item["playingFit"] = spec["playingFit"]
    item["titles"].update(spec.get("titles", {}))


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    all_specs = json.loads(COMMONS_SPECS.read_text())
    painting_specs = all_specs[22:80]
    met_specs = json.loads(MET_SPECS.read_text())
    translations = json.loads(TRANSLATIONS_PATH.read_text())
    catalog = []

    for spec in painting_specs:
        slug = slugify(spec["fr"])
        item_id = f"commons-{slug}"
        if item_id in COMMONS_OVERRIDES:
            image_url = ""
        else:
            path = copy_existing_painting(spec)
            image_url = f"./library/{path.name}"
        catalog.append({
            "id": item_id,
            "imageUrl": image_url,
            "titles": {"fr": spec["fr"], "en": spec["query"]},
            "author": spec["author"],
            "year": spec["year"],
            "sourceUrl": "https://commons.wikimedia.org/w/index.php?" + urllib.parse.urlencode({"search": spec["query"], "title": "Special:MediaSearch", "type": "image"}),
            "license": "Public Domain",
            "category": "painting",
            "fit": "contain",
            "anchor": "top"
        })

    for spec in met_specs:
        path = OUT_DIR / f"met-{spec['id']}.jpg"
        download(spec["image"], path)
        catalog.append({
            "id": f"met-{spec['id']}",
            "imageUrl": f"./library/{path.name}",
            "titles": {"fr": spec["fr"]},
            "author": spec["author"],
            "year": spec["year"],
            "sourceUrl": spec["source"],
            "license": "Public Domain",
            "category": spec["category"],
            "fit": "contain",
            "anchor": "top"
        })

    borobudur_source = ROOT / "assets" / "normalized_512" / "borobudur.jpg"
    borobudur_path = OUT_DIR / "cc0-borobudur.jpg"
    if not borobudur_path.exists():
        shutil.copy2(borobudur_source, borobudur_path)
    catalog.append({
        "id": "cc0-borobudur",
        "imageUrl": "./library/cc0-borobudur.jpg",
        "titles": {"fr": "Borobudur", "en": "Borobudur"},
        "author": "Architecture bouddhique javanaise",
        "year": "IXe siècle",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:Panoramic_views_of_Borobudur.jpg",
        "license": "CC0",
        "category": "architecture",
        "fit": "contain",
        "anchor": "top"
    })

    angkor_path = OUT_DIR / "pd-angkor-wat.jpg"
    download("https://upload.wikimedia.org/wikipedia/commons/1/1b/De_drie_torens_van_den_tempel_van_Angkor-Wat.jpg", angkor_path)
    catalog.append({
        "id": "pd-angkor-wat",
        "imageUrl": "./library/pd-angkor-wat.jpg",
        "titles": {"fr": "Angkor Vat", "en": "Angkor Wat"},
        "author": "Émile Gsell",
        "year": "1866",
        "sourceUrl": "https://commons.wikimedia.org/wiki/File:De_drie_torens_van_den_tempel_van_Angkor-Wat.jpg",
        "license": "Public Domain",
        "category": "architecture",
        "fit": "contain",
        "anchor": "top"
    })

    if len(catalog) != 76:
        raise RuntimeError(f"Expected 76 catalog entries, got {len(catalog)}")

    liberty = next(item for item in catalog if item["id"] == LIBERTY_ID)
    liberty_path = OUT_DIR / "commons-la-liberte-guidant-le-peuple.jpg"
    download(LIBERTY_IMAGE_URL, liberty_path)
    liberty["imageUrl"] = f"./library/{liberty_path.name}"
    liberty["sourceUrl"] = LIBERTY_SOURCE_URL

    for item in catalog:
        override = COMMONS_OVERRIDES.get(item["id"])
        if override:
            apply_commons_override(item, override)

    for item in catalog:
        translated = translations.get(item["id"])
        if not translated:
            raise RuntimeError(f"Missing title translations for {item['id']}")
        item["titles"].update(translated)
    CATALOG_PATH.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(catalog)} items to {CATALOG_PATH}")


if __name__ == "__main__":
    main()
