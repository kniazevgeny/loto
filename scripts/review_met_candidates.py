#!/usr/bin/env python3
import json
import urllib.parse
import urllib.request


QUERIES = [
    "Colosseum Rome",
    "Notre Dame Paris cathedral",
    "Hagia Sophia architecture",
    "Angkor Wat architecture",
    "Machu Picchu",
    "Stonehenge",
    "Alhambra Granada architecture",
]
BASE = "https://collectionapi.metmuseum.org/public/collection/v1"
USER_AGENT = "loto-art-studio/0.1"


def get_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


for query in QUERIES:
    result = get_json(f"{BASE}/search?hasImages=true&q={urllib.parse.quote(query)}")
    matches = []
    for object_id in (result.get("objectIDs") or [])[:40]:
        item = get_json(f"{BASE}/objects/{object_id}")
        if item.get("isPublicDomain") and item.get("primaryImageSmall"):
            matches.append({
                "id": object_id,
                "title": item.get("title"),
                "artist": item.get("artistDisplayName"),
                "date": item.get("objectDate"),
                "image": item.get("primaryImageSmall"),
                "source": item.get("objectURL"),
            })
        if len(matches) == 4:
            break
    print(json.dumps({"query": query, "matches": matches}, ensure_ascii=False))
