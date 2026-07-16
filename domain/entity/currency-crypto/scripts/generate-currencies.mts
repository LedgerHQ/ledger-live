/**
 * Seeds/syncs this package's currency files from the legacy `@ledgerhq/cryptoassets`
 * registry so the two stay at parity during the migration (this registry is the
 * primary source — see README; legacy is dual-maintained until it is dropped).
 * Run with: NODE_OPTIONS="--conditions=@ledgerhq/source" npx tsx scripts/generate-currencies.mts
 *
 * Input:  @ledgerhq/cryptoassets `cryptocurrenciesById`
 * Output: src/currencies/<id>.ts + src/currencies/index.ts (file names follow legacy keys)
 */

import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Dynamic import so tsx resolves the extensionless TS specifier (static imports
// fall through to Node 24's native TS resolver, which cannot add the extension).
const { cryptocurrenciesById } = await import(
  "../../../../libs/ledgerjs/packages/cryptoassets/src/currencies"
);

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../src/currencies");

// Wipe the output dir so currencies dropped/renamed in legacy don't leave stale
// orphan files (the whole directory is generated; nothing here is hand-written).
rmSync(outDir, { recursive: true, force: true });
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
    const props = entries.map(([k, v]) => `${inner}${k}: ${serialize(v, indent + 1)}`).join(",\n");
    return `{\n${props},\n${pad}}`;
  }

  return String(value);
}

// Emit one file per currency `.id`. A few legacy map keys differ from the currency's
// own `.id` (e.g. key "groestlcoin" → id "groestcoin"), and on load the legacy store
// reuses `cryptocurrenciesById` as its by-id index, adding `.id`-keyed aliases — so
// `Object.keys` can surface the same `.id` twice. The domain registry is keyed by
// `.id`, so dedupe by `.id`. Sort case-insensitively so the lowercase key wins / names
// the file.
const allIds = Object.keys(cryptocurrenciesById).sort(
  (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()) || a.localeCompare(b),
);
const seen = new Set<string>();
const ids = allIds.filter(key => {
  const currencyId = (cryptocurrenciesById[key] as { id: string }).id;
  if (seen.has(currencyId)) return false;
  seen.add(currencyId);
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
const exports = ids.map(id => `export * from "./${id}";`).join("\n");

writeFileSync(join(outDir, "index.ts"), `${exports}\n`);

console.log(`Generated ${ids.length} currency files + index.ts in ${outDir}`);
