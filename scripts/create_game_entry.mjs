import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const gameDirectory = resolve(root, "dist/game");

mkdirSync(gameDirectory, { recursive: true });
copyFileSync(resolve(root, "dist/index.html"), resolve(gameDirectory, "index.html"));
