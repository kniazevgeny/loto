# Loto Art Studio

A browser-based editor for creating and printing a custom art loto game. It generates playing cards and a matching set of titled drawing tokens, with controls for image selection, repetition, typography, geometry, and print styling.

The production build is configured for the `/loto/` URL path.

## Development

```sh
npm install
npm run dev
```

Type-check and build:

```sh
npm run check
npm run build
```

The static deployment output is written to `dist/`.

## Library tools

The scripts in `scripts/` can build alternative public-domain image libraries from Wikimedia Commons or the Art Institute of Chicago. They require Python 3 and network access.

## Deployment

GitHub Actions validates and builds every push to `main`, then publishes `dist/` to GitHub Pages. The site is configured for the `/loto/` project path; generated deployment files are not committed.

## Licensing

Application source code is licensed under the MIT License. Artwork and photographs are not covered by the MIT License. Their individual source and license metadata is stored in `app-public/library/library.json`.
