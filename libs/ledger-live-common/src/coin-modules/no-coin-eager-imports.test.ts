import * as esbuild from "esbuild";
import * as path from "path";

const BANNED_LIBS = ["tronweb", "web3"];

// Sources allowed to import coin-* packages or families/* directly.
const ALLOWED_SOURCES = [
  "ledger-live-common/src/families/",
  "ledger-live-common/src/coin-modules/",
  "ledger-live-common/src/bridge/generic-alpaca/", // LIVE-29339
  "ledger-live-common/src/wallet-api/", // LIVE-29338
];

// Import paths with minimal bundle impact — types and error definitions only.
const LOW_IMPACT_PATH = /\/(types|errors)(\/|$)/;

let metafileInputs: esbuild.Metafile["inputs"];
const root = path.resolve(__dirname, "../../..");
const rel = (p: string) => path.relative(root, p).replace(/\\/g, "/");

beforeAll(async () => {
  const result = await esbuild.build({
    entryPoints: [path.resolve(__dirname, "non-regression-entry.ts")],
    bundle: true,
    write: false,
    packages: "external",
    platform: "node",
    format: "cjs",
    metafile: true,
  });
  metafileInputs = result.metafile.inputs;
}, 15000);

function buildCausesMap(predicate: (pkg: string) => boolean): Record<string, string[]> {
  const causes: Record<string, string[]> = {};
  for (const [file, info] of Object.entries(metafileInputs)) {
    for (const imp of info.imports) {
      if (predicate(imp.path)) {
        (causes[imp.path] ??= []).push(rel(file));
      }
    }
  }
  return Object.fromEntries(
    Object.entries(causes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, v.sort()]),
  );
}

test("coin-* eager imports — must be zero outside allowed zones", () => {
  const violations: Record<string, string[]> = {};
  for (const [file, info] of Object.entries(metafileInputs)) {
    const src = rel(file);
    if (ALLOWED_SOURCES.some(p => src.includes(p))) continue;
    for (const imp of info.imports) {
      if (!imp.path.startsWith("@ledgerhq/coin-")) continue;
      if (imp.path.startsWith("@ledgerhq/coin-module-framework")) continue;
      if (LOW_IMPACT_PATH.test(imp.path)) continue;
      (violations[imp.path] ??= []).push(src);
    }
  }
  expect(violations).toEqual({});
});

test("families/* eager imports — must be zero outside allowed zones", () => {
  // Tracked exceptions not yet fixed — shrink this list as tickets close.
  const KNOWN: Record<string, string> = {
    "ledger-live-common/src/families/bitcoin/ACRESetup.ts": "LIVE-29411",
  };
  const violations: Record<string, string[]> = {};
  for (const [file, info] of Object.entries(metafileInputs)) {
    const src = rel(file);
    if (ALLOWED_SOURCES.some(p => src.includes(p))) continue;
    for (const imp of info.imports) {
      const impRel = rel(imp.path);
      if (!impRel.includes("ledger-live-common/src/families/")) continue;
      if (KNOWN[impRel]) continue;
      (violations[impRel] ??= []).push(src);
    }
  }
  expect(violations).toEqual({});
});

test("banned heavy libs are not imported", () => {
  const causes = buildCausesMap(pkg =>
    BANNED_LIBS.some(banned => pkg === banned || pkg.startsWith(`${banned}/`)),
  );
  expect(causes).toEqual({});
});
