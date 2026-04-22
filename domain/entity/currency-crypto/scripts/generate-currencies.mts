/**
 * Generates one TypeScript file per crypto currency under src/currencies/.
 * Run with: NODE_OPTIONS="--conditions=@ledgerhq/source" npx tsx scripts/generate-currencies.mts
 *
 * Source of truth: @ledgerhq/cryptoassets cryptocurrenciesById
 * Output: src/currencies/<id>.ts + src/currencies/index.ts
 */

import { cryptocurrenciesById } from "../../../../libs/ledgerjs/packages/cryptoassets/src/currencies";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../src/currencies");

mkdirSync(outDir, { recursive: true });

function serialize(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  const inner = "  ".repeat(indent + 1);

  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map(v => `${inner}${serialize(v, indent + 1)}`).join(",\n");
    return `[\n${items},\n${pad}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    );
    if (entries.length === 0) return "{}";
    const props = entries
      .map(([k, v]) => `${inner}${k}: ${serialize(v, indent + 1)}`)
      .join(",\n");
    return `{\n${props},\n${pad}}`;
  }

  return String(value);
}

// Deduplicate keys that differ only in casing (e.g. "lbry" and "LBRY" are the same
// currency). Sort case-insensitively so lowercase forms are processed first and win.
const allIds = Object.keys(cryptocurrenciesById).sort((a, b) =>
  a.toLowerCase().localeCompare(b.toLowerCase()) || a.localeCompare(b),
);
const seen = new Set<string>();
const ids = allIds.filter(id => {
  const key = id.toLowerCase();
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

for (const id of ids) {
  const currencyData = cryptocurrenciesById[id] as Record<string, unknown>;
  const varName = id.replace(/[^a-zA-Z0-9]/g, "_");
  const props = Object.entries(currencyData)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `  ${k}: ${serialize(v, 1)}`)
    .join(",\n");
  const content = `import { currency } from "../define";\n\nexport const ${varName} = currency({\n${props},\n});\n`;
  writeFileSync(join(outDir, `${id}.ts`), content);
}

// Generate index.ts
const exports = ids
  .map(id => `export * from "./${id}";`)
  .join("\n");

writeFileSync(join(outDir, "index.ts"), `${exports}\n`);

console.log(`Generated ${ids.length} currency files + index.ts in ${outDir}`);
