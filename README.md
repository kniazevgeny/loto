# Loto Art Studio

A browser-based editor and game companion for custom art loto. It generates playing cards and a matching set of titled drawing tokens, with controls for image selection, repetition, typography, geometry, and print styling.

The companion at `/loto/game?set=default` presents the selected artworks and numbers during play. It supports English, French, and Russian labels, adjustable pacing, fullscreen play, and preloads the round for offline use on the current device.

The production build is configured for the `/loto/` URL path.

## Development

```sh
npm install
npm run dev
```

Run the release checks and build:

```sh
npm run check:release
npm run build
```

The static deployment output is written to `dist/`.

## Library tools

The scripts in `scripts/` can build alternative public-domain image libraries from Wikimedia Commons or the Art Institute of Chicago. They require Python 3 and network access.

## Deployment

GitHub Actions runs the full release checks and builds every push to `main`, then publishes `dist/` to GitHub Pages. The site is configured for the `/loto/` project path; generated deployment files are not committed.

## Licensing

Application source code is licensed under the MIT License. Artwork and photographs are not covered by the MIT License. Their individual source and license metadata is stored in `app-public/library/library.json`.
