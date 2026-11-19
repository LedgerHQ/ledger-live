export type Area = "new" | "legacy";
export type Kind = Area | "allowlisted";

export type ChangedFile = {
  filename: string;
  additions: number;
  deletions: number;
  previous_filename?: string;
};

export type CountLines = (path: string) => number | undefined;

export type AreaLines = { area: Kind; label: string; added: number; deleted: number };

export type AllowlistEntry = { path: string; reason: string; target: string; ticket: string };

export type LegacyScoreReport = {
  newLines: number;
  legacyGrowth: number;
  legacyRemoved: number;
  score: number;
  areas: AreaLines[];
};

export const MIN_LINES = 50;
export const RED_BELOW = 0.2;
export const GREEN_ABOVE = 0.8;
export const THANKS_REMOVED = 1000;

const ALLOWLIST_FIELDS = ["path", "reason", "target", "ticket"] as const;
const TICKET = /^LIVE-\d+$/;

const SOURCE = /\.tsx?$/;
const DECLARATION = /\.d\.ts$/;
const TEST_HELPER = String.raw`test[-_]?(utils?|helpers?)|\w*Test(Utils?|Helpers?)`;
const TEST = new RegExp(
  [
    String.raw`\.(test|spec|stories|mocks?|fixtures?|generated)\.tsx?$`,
    String.raw`(^|\/)(__tests__|__integrations__|__mocks__|__fixtures__|__snapshots__|__test-utils__|fixtures|mocks?|tests?|testing|e2e|generated|${TEST_HELPER})\/`,
    String.raw`(^|\/|-)(fixtures?|mocks?|testing|setupTests|jest-setup|tests?\.setup|${TEST_HELPER})\.tsx?$`,
    String.raw`\.config\.tsx?$`,
  ].join("|"),
  "i",
);

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
      /^libs\/(coin-tester|coin-tester-modules|coin-modules-monitoring|live-e2e-shared|live-dmk-speculos|speculos-transport|disable-network-setup|test-utils|wallet-framework-test-setup)\//,
    area: null,
  },
  { pattern: /^libs\/[^/]+\//, area: "legacy" },
  // Developer tooling and the dialogs mount point are not debt
  {
    pattern:
      /^apps\/ledger-live-(desktop\/src\/mvvm\/features\/(DevTools|GlobalDialogs)|mobile\/src\/mvvm\/features\/DevTools)\//,
    area: null,
  },
  // Per-coin UI glue follows the coin modules
  { pattern: /^apps\/ledger-live-desktop\/src\/renderer\/families\//, area: null },
  // Files at the renderer root are app composition (entry, store, setup)
  { pattern: /^apps\/ledger-live-desktop\/src\/renderer\/[^/]+$/, area: null },
  { pattern: /^apps\/ledger-live-desktop\/src\/(renderer|mvvm)\//, area: "legacy" },
  // Mobile app composition, per-coin glue and generated code
  {
    pattern:
      /^apps\/ledger-live-mobile\/src\/(navigation|setup|state-manager|middleware|families|e2e|generated|native-modules|i18n|locales|config|bridge|firebase)\//,
    area: null,
  },
  { pattern: /^apps\/ledger-live-mobile\/src\/[^/]+\//, area: "legacy" },
];

function isAllowlisted(path: string, entry: string): boolean {
  return path === entry || path.startsWith(entry.endsWith("/") ? entry : `${entry}/`);
}

export function classify(
  path: string,
  allowlist: AllowlistEntry[] = [],
): { area: Kind; label: string } | null {
  if (!SOURCE.test(path) || DECLARATION.test(path) || TEST.test(path)) return null;
  const allowed = allowlist.find(entry => isAllowlisted(path, entry.path));
  if (allowed) return { area: "allowlisted", label: `${allowed.path} (${allowed.ticket})` };
  for (const { pattern, area } of RULES) {
    const match = pattern.exec(path);
    if (match) return area ? { area, label: match[0].replace(/\/$/, "") } : null;
  }
  return null;
}

function areaOf(path: string | undefined, allowlist: AllowlistEntry[]): Kind | null {
  return (path && classify(path, allowlist)?.area) || null;
}

// A rename only reports its changed lines: a move across areas is a deletion at the source and an
// addition at the destination of the whole file
function expandMoves(
  files: ChangedFile[],
  allowlist: AllowlistEntry[],
  countLines?: CountLines,
): ChangedFile[] {
  return files.flatMap(file => {
    const { filename, previous_filename, additions, deletions } = file;
    if (!previous_filename || areaOf(previous_filename, allowlist) === areaOf(filename, allowlist))
      return [file];
    const length = countLines?.(filename);
    if (length === undefined) return [file];
    return [
      { filename: previous_filename, additions: 0, deletions: length - additions + deletions },
      { filename, additions: length, deletions: 0 },
    ];
  });
}

export function computeLegacyScore(
  files: ChangedFile[],
  countLines?: CountLines,
  allowlist: AllowlistEntry[] = [],
): LegacyScoreReport {
  const byLabel = new Map<string, AreaLines>();
  for (const { filename, additions, deletions } of expandMoves(files, allowlist, countLines)) {
    const found = classify(filename, allowlist);
    if (!found || (!additions && !deletions)) continue;
    const entry = byLabel.get(found.label) ?? { ...found, added: 0, deleted: 0 };
    entry.added += additions;
    entry.deleted += deletions;
    byLabel.set(found.label, entry);
  }
  const areas = [...byLabel.values()].sort((a, b) => b.added - a.added || b.deleted - a.deleted);
  const sum = (area: Area, key: "added" | "deleted") =>
    areas.filter(a => a.area === area).reduce((t, a) => t + a[key], 0);
  const newLines = sum("new", "added");
  const legacyNet = sum("legacy", "added") - sum("legacy", "deleted");
  // Legacy is maintained, not grown: only its net growth weighs against the new layers
  const legacyGrowth = Math.max(0, legacyNet);
  const total = newLines + legacyGrowth;
  return {
    newLines,
    legacyGrowth,
    legacyRemoved: Math.max(0, -legacyNet),
    score: total ? newLines / total : 1,
    areas,
  };
}

export function legacyGrowthRows({ areas }: LegacyScoreReport): string {
  return areas
    .filter(a => a.area === "legacy" && a.added > a.deleted)
    .map(a => `\`${a.label}\` +${a.added - a.deleted}`)
    .join(", ");
}

// Narrowest folder holding every added file of the growing legacy areas, to suggest as an allowlist path
export function legacyFolder(
  files: ChangedFile[],
  allowlist: AllowlistEntry[] = [],
): string | undefined {
  const legacy = files.flatMap(file => {
    const found = classify(file.filename, allowlist);
    return found?.area === "legacy" ? [{ ...file, label: found.label }] : [];
  });
  const net = new Map<string, number>();
  for (const f of legacy) net.set(f.label, (net.get(f.label) ?? 0) + f.additions - f.deletions);
  const dirs = legacy
    .filter(f => f.additions > 0 && (net.get(f.label) ?? 0) > 0)
    .map(f => f.filename.split("/").slice(0, -1));
  if (!dirs.length) return undefined;
  const common = dirs.reduce((prefix, dir) => {
    const mismatch = prefix.findIndex((segment, i) => segment !== dir[i]);
    return mismatch === -1 ? prefix : prefix.slice(0, mismatch);
  });
  return common.length ? `${common.join("/")}/` : undefined;
}

function stringField(entry: unknown, key: string): string {
  if (typeof entry !== "object" || entry === null) return "";
  const value: unknown = new Map(Object.entries(entry)).get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parseAllowlist(
  raw: unknown,
  exists: (path: string) => boolean,
): { entries: AllowlistEntry[]; errors: string[] } {
  if (!Array.isArray(raw)) return { entries: [], errors: ["the allowlist must be a JSON array"] };
  const entries: AllowlistEntry[] = [];
  const errors: string[] = [];
  raw.forEach((item: unknown, index) => {
    const entry = {
      path: stringField(item, "path"),
      reason: stringField(item, "reason"),
      target: stringField(item, "target"),
      ticket: stringField(item, "ticket"),
    };
    const name = entry.path ? `\`${entry.path}\`` : `entry ${index}`;
    const problems = ALLOWLIST_FIELDS.filter(key => !entry[key]).map(
      key => `${name} has no \`${key}\``,
    );
    if (entry.ticket && !TICKET.test(entry.ticket)) {
      problems.push(`${name} has a ticket \`${entry.ticket}\` that is not a LIVE-<number> key`);
    }
    if (entry.path && !exists(entry.path))
      problems.push(`${name} does not exist in the repository`);
    if (problems.length) errors.push(...problems);
    else entries.push(entry);
  });
  return { entries, errors };
}

export function scoreEmoji(score: number): string {
  if (score < RED_BELOW) return "🔴";
  if (score > GREEN_ABOVE) return "🟢";
  return "🟡";
}

const KIND_LABEL: Record<Kind, string> = {
  new: "✅ new",
  legacy: "⚠️ legacy",
  allowlisted: "🗂️ allowlisted",
};

export function formatReport({ areas, newLines, legacyGrowth, score }: LegacyScoreReport): string {
  const rows = areas.map(
    a => `| ${KIND_LABEL[a.area]} | \`${a.label}\` | +${a.added} | −${a.deleted} |`,
  );
  return [
    `### ${scoreEmoji(score)} Architecture score: ${Math.floor(score * 100)}%`,
    "",
    `+${newLines} lines in the [new layers](https://github.com/LedgerHQ/ledger-live/blob/develop/docs/monorepo-architecture.md) (\`shared/\`, \`domain/\`, \`features/\`) against a net growth of +${legacyGrowth} in legacy areas (\`libs/\`, app feature folders). Counts production \`.ts\`/\`.tsx\` lines.`,
    "",
    "| Kind | Area | Added | Deleted |",
    "| --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}
