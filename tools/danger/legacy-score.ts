export type Area = "new" | "legacy";

export type ChangedFile = { filename: string; additions: number; deletions: number };

export type LegacyScoreReport = {
  newLines: number;
  legacyLines: number;
  legacyRemoved: number;
  score: number;
  areas: { area: Area; label: string; lines: number }[];
};

export const MIN_LINES = 50;
export const RED_BELOW = 0.2;
export const GREEN_ABOVE = 0.8;
export const THANKS_REMOVED = 1000;

// Legacy paths where shipping code is legitimate for now; each folder carries a README saying why
export const ALLOWLIST = [
  "libs/ledger-live-common/src/account-data/full-sync/",
  "libs/ledger-live-common/src/account-data/coin-module/",
];

const SOURCE = /\.tsx?$/;
const DECLARATION = /\.d\.ts$/;
const TEST =
  /(\.(test|spec|stories|mocks?)\.tsx?$)|(^|\/)(__tests__|__integrations__|__mocks__|__fixtures__|__snapshots__|fixtures|mocks?|tests?|e2e)\//;

const RULES: { pattern: RegExp; area: Area | null }[] = [
  {
    pattern: /^(shared|domain\/entity|domain\/api|features\/platform|features\/flow)\/[^/]+\//,
    area: "new",
  },
  // No new-architecture home for coin modules yet
  { pattern: /^libs\/coin-modules\//, area: null },
  // Test and e2e infrastructure, not product code
  {
    pattern:
      /^libs\/(coin-tester|coin-tester-modules|coin-modules-monitoring|live-e2e-shared|speculos-transport|test-utils|wallet-framework-test-setup)\//,
    area: null,
  },
  { pattern: /^libs\/[^/]+\//, area: "legacy" },
  // Per-coin UI glue follows the coin modules
  { pattern: /^apps\/ledger-live-desktop\/src\/renderer\/families\//, area: null },
  // Files at the renderer root are app composition (entry, store, setup)
  { pattern: /^apps\/ledger-live-desktop\/src\/renderer\/[^/]+$/, area: null },
  { pattern: /^apps\/ledger-live-desktop\/src\/(renderer|mvvm)\//, area: "legacy" },
  // Mobile app composition, per-coin glue and generated code
  {
    pattern:
      /^apps\/ledger-live-mobile\/src\/(navigation|setup|families|e2e|generated|native-modules|i18n|locales|config|bridge|firebase)\//,
    area: null,
  },
  { pattern: /^apps\/ledger-live-mobile\/src\/[^/]+\//, area: "legacy" },
];

export function classify(path: string): { area: Area; label: string } | null {
  if (!SOURCE.test(path) || DECLARATION.test(path) || TEST.test(path)) return null;
  if (ALLOWLIST.some(prefix => path.startsWith(prefix))) return null;
  for (const { pattern, area } of RULES) {
    const match = pattern.exec(path);
    if (match) return area ? { area, label: match[0].replace(/\/$/, "") } : null;
  }
  return null;
}

export function computeLegacyScore(files: ChangedFile[]): LegacyScoreReport {
  const byLabel = new Map<string, { area: Area; label: string; lines: number }>();
  let legacyDeleted = 0;
  for (const { filename, additions, deletions } of files) {
    const found = classify(filename);
    if (found?.area === "legacy") legacyDeleted += deletions;
    if (!found || !additions) continue;
    const entry = byLabel.get(found.label) ?? { ...found, lines: 0 };
    entry.lines += additions;
    byLabel.set(found.label, entry);
  }
  const areas = [...byLabel.values()].sort((a, b) => b.lines - a.lines);
  const sum = (area: Area) => areas.filter(a => a.area === area).reduce((t, a) => t + a.lines, 0);
  const newLines = sum("new");
  const legacyLines = sum("legacy");
  const total = newLines + legacyLines;
  const legacyRemoved = Math.max(0, legacyDeleted - legacyLines);
  return { newLines, legacyLines, legacyRemoved, score: total ? newLines / total : 1, areas };
}

export function scoreEmoji(score: number): string {
  if (score < RED_BELOW) return "🔴";
  if (score > GREEN_ABOVE) return "🟢";
  return "🟡";
}

export function formatReport({ areas, newLines, legacyLines, score }: LegacyScoreReport): string {
  const rows = areas.map(
    a => `| ${a.area === "new" ? "✅ new" : "⚠️ legacy"} | \`${a.label}\` | +${a.lines} |`,
  );
  return [
    `### ${scoreEmoji(score)} Architecture score: ${Math.floor(score * 100)}%`,
    "",
    `+${newLines} lines in the [new layers](https://github.com/LedgerHQ/ledger-live/blob/develop/docs/monorepo-architecture.md) (\`shared/\`, \`domain/\`, \`features/\`) against +${legacyLines} in legacy areas (\`libs/\`, app feature folders). Counts added non-test \`.ts\`/\`.tsx\` lines.`,
    "",
    "| Kind | Area | Lines |",
    "| --- | --- | --- |",
    ...rows,
  ].join("\n");
}
