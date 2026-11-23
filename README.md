# Loto Art Studio

A browser-based editor and game companion for custom art loto. It generates playing cards and a matching set of titled drawing tokens, with controls for image selection, repetition, typography, geometry, and print styling.

The companion at `/loto/game/?set=default` calls the 75 artworks and 88 numbers on the original 20-card Chef-d’Œuvre Bingo and Loto Art Studio printed sets. Start immediately while offline preparation runs in the background. The caller supports English, French, and Russian labels, adjustable pacing, and fullscreen play. When an Art Story is available, open it to pause the round and explore a painting's details.

For a custom set, choose **Play this project** in the editor. It opens that project's cards in the browser where the project is saved.

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
