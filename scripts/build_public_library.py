#!/usr/bin/env python3
import json
import re
import time
import urllib.parse
import urllib.request
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "library"
CATALOG_PATH = OUT_DIR / "library.json"
API_URL = "https://api.artic.edu/api/v1/artworks/search"
IIIF_URL = "https://www.artic.edu/iiif/2"
USER_AGENT = "loto-art-studio/0.1 (public-domain educational print tool)"
TARGET_COUNT = 76
MAX_PER_ARTIST = 2


def request_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def download(url, path):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        path.write_bytes(response.read())


def slugify(value):
    value = value.lower().encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")[:70]


def fetch_candidates():
    fields = "id,title,artist_title,artist_display,date_display,image_id,is_public_domain,thumbnail"
    candidates = []
    for page in range(1, 9):
        params = urllib.parse.urlencode({"limit": 100, "page": page, "fields": fields})
        data = request_json(f"{API_URL}?{params}")
        candidates.extend(data.get("data", []))
        if len(candidates) >= 500:
            break
        time.sleep(0.15)
    return candidates


def select_items(candidates):
    selected = []
    artist_counts = Counter()
    seen_titles = set()
    for item in candidates:
        if not item.get("is_public_domain") or not item.get("image_id"):
            continue
        thumbnail = item.get("thumbnail") or {}
        if min(thumbnail.get("width", 0), thumbnail.get("height", 0)) < 512:
            continue
        title = (item.get("title") or "").strip()
        if not title or title.lower() == "untitled" or title.lower() in seen_titles:
            continue
        artist = (item.get("artist_title") or item.get("artist_display") or "Artiste inconnu").strip()
        if artist_counts[artist] >= MAX_PER_ARTIST:
            continue
        selected.append(item)
        artist_counts[artist] += 1
        seen_titles.add(title.lower())
        if len(selected) == TARGET_COUNT:
            return selected
    raise RuntimeError(f"Only found {len(selected)} suitable public-domain works")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    selected = select_items(fetch_candidates())
    catalog = []
    for index, item in enumerate(selected, start=1):
        filename = f"{index:02d}-{slugify(item['title'])}-{item['id']}.jpg"
        path = OUT_DIR / filename
        image_url = f"{IIIF_URL}/{item['image_id']}/full/512,/0/default.jpg"
        if not path.exists():
            download(image_url, path)
            time.sleep(0.08)
        artist = (item.get("artist_title") or item.get("artist_display") or "Artiste inconnu").split("\n")[0]
        catalog.append({
            "id": f"aic-{item['id']}",
            "imageUrl": f"./library/{filename}",
            "titles": {"en": item["title"], "fr": item["title"]},
            "author": artist,
            "year": item.get("date_display") or "",
            "sourceUrl": f"https://www.artic.edu/artworks/{item['id']}",
            "license": "Public Domain",
            "fit": "contain",
            "anchor": "top"
        })
        print(f"{index:02d}/{TARGET_COUNT} {item['title']}")
    CATALOG_PATH.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {CATALOG_PATH}")


if __name__ == "__main__":
    main()
