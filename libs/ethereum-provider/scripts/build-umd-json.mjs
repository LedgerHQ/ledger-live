import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const umdPath = path.join(rootDir, "lib", "ethereum-provider.umd.js");
const jsonPath = path.join(rootDir, "lib", "ethereum-provider.umd.json");

const code = await readFile(umdPath, "utf8");
await writeFile(jsonPath, JSON.stringify({ code }));
