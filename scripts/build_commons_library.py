#!/usr/bin/env python3
import html
import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPECS_PATH = ROOT / "assets" / "public_library_specs.json"
OUT_DIR = ROOT / "public" / "library"
CATALOG_PATH = OUT_DIR / "library.json"
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
USER_AGENT = "loto-art-studio/0.1 (public-domain educational print tool; https://openai.com/codex)"
TARGET_COUNT = 76


def request_json(params):
    url = COMMONS_API + "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def metadata_value(metadata, key):
    value = metadata.get(key, {})
    return value.get("value") if isinstance(value, dict) else None


def clean_html(value):
    if not value:
        return ""
    return html.unescape(re.sub(r"<[^>]+>", "", value)).strip()


def is_public_domain(metadata):
    license_name = (metadata_value(metadata, "LicenseShortName") or "").lower()
    copyrighted = (metadata_value(metadata, "Copyrighted") or "").lower()
    return copyrighted == "false" or "public domain" in license_name or license_name in {"cc0", "cc-zero"}


def search(spec):
    params = {
        "action": "query",
        "format": "json",
        "generator": "search",
        "gsrsearch": spec["query"],
        "gsrnamespace": "6",
        "gsrlimit": "12",
        "prop": "imageinfo",
        "iiprop": "url|mime|size|extmetadata",
        "iiurlwidth": "512",
    }
    data = request_json(params)
    pages = list(data.get("query", {}).get("pages", {}).values())
    for page in pages:
        info = (page.get("imageinfo") or [{}])[0]
        metadata = info.get("extmetadata") or {}
        mime = info.get("mime", "")
        if info.get("thumburl") and mime in {"image/jpeg", "image/png"} and is_public_domain(metadata):
            return page, info
    return None


def slugify(value):
    value = value.lower().encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")[:70]


def download(url, path):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=60) as response:
        path.write_bytes(response.read())


def main():
    specs = json.loads(SPECS_PATH.read_text())
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    catalog = []
    failures = []
    for spec in specs:
        if len(catalog) >= TARGET_COUNT:
            break
        try:
            result = search(spec)
            if not result:
                failures.append(spec["query"])
                print(f"MISS {spec['query']}")
                time.sleep(0.45)
                continue
            page, info = result
            extension = ".png" if info.get("mime") == "image/png" else ".jpg"
            filename = f"{len(catalog) + 1:02d}-{slugify(spec['fr'])}{extension}"
            path = OUT_DIR / filename
            if not path.exists():
                download(info["thumburl"], path)
            metadata = info.get("extmetadata") or {}
            license_name = metadata_value(metadata, "LicenseShortName") or "Public Domain"
            catalog.append({
                "id": f"commons-{slugify(spec['fr'])}-{len(catalog) + 1}",
                "imageUrl": f"./library/{filename}",
                "titles": {"fr": spec["fr"], "en": spec["query"]},
                "author": spec["author"],
                "year": spec["year"],
                "sourceUrl": info.get("descriptionurl"),
                "license": "CC0" if "cc0" in license_name.lower() else "Public Domain",
                "fit": "contain",
                "anchor": "top",
                "commonsTitle": page.get("title"),
                "credit": clean_html(metadata_value(metadata, "Credit")),
            })
            print(f"{len(catalog):02d}/{TARGET_COUNT} {spec['fr']}")
        except Exception as error:
            failures.append(f"{spec['query']}: {error}")
            print(f"ERROR {spec['query']}: {error}")
        time.sleep(0.45)
    if len(catalog) < TARGET_COUNT:
        raise RuntimeError(f"Downloaded {len(catalog)} / {TARGET_COUNT}; failures: {len(failures)}")
    CATALOG_PATH.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {CATALOG_PATH}")


if __name__ == "__main__":
    main()
