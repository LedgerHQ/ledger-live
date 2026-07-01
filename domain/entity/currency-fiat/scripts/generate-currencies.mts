/**
 * Generates one TypeScript file per fiat currency under src/currencies/.
 * Run with: NODE_OPTIONS="--conditions=@ledgerhq/source" npx tsx scripts/generate-currencies.mts
 *
 * Source of truth: @ledgerhq/cryptoassets listFiatCurrencies()
 * Output: src/currencies/<id>.ts + src/currencies/index.ts
 *
 * Legacy fiats carry no `id`; the domain entity does. The id is derived as the
 * lowercased ticker (e.g. "USD" -> "usd"), matching the parity test.
 */

import * as fiatsNs from "../../../../libs/ledgerjs/packages/cryptoassets/src/fiats";
import { rmSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// `fiats.ts` resolves to a CJS-interop namespace under some loaders; unwrap `default`.
const { listFiatCurrencies } = ((fiatsNs as { default?: unknown }).default ?? fiatsNs) as {
  listFiatCurrencies: () => Array<Record<string, unknown> & { type: string; ticker: string }>;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../src/currencies");

// Wipe so renamed/dropped legacy tickers don't leave orphan files behind.
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

// Reserved words can't be used as `export const` names (e.g. ticker "TRY" -> "try").
// The export name is cosmetic — the registry keys by `.id` — so we suffix `_`.
const RESERVED = new Set(["try", "for", "new", "var", "let", "do", "if", "in"]);

const currencies = [...listFiatCurrencies()].sort((a, b) =>
  a.ticker.toLowerCase().localeCompare(b.ticker.toLowerCase()),
);

for (const cur of currencies) {
  const id = cur.ticker.toLowerCase();
  const { type, ...rest } = cur;
  const data = { type, id, ...rest };
  const safeId = id.replace(/[^a-zA-Z0-9]/g, "_");
  const varName = RESERVED.has(safeId) ? `${safeId}_` : safeId;
  const props = Object.entries(data)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `  ${k}: ${serialize(v, 1)}`)
    .join(",\n");
  const content = `import { fiat } from "../define";\n\nexport const ${varName} = fiat({\n${props},\n});\n`;
  writeFileSync(join(outDir, `${id}.ts`), content);
}

// Generate index.ts
const exports = currencies.map(c => `export * from "./${c.ticker.toLowerCase()}";`).join("\n");

writeFileSync(join(outDir, "index.ts"), `${exports}\n`);

console.log(`Generated ${currencies.length} currency files + index.ts in ${outDir}`);
