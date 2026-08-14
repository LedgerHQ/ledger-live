import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, relative, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import { QuarantineEntrySchema, type LoadedEntry } from "./schema.ts";

export interface LoadOptions {
  /** Absolute path to the repo root. Defaults to two levels above this tool. */
  repoRoot?: string;
  /** Absolute path to the quarantine registry directory. */
  registryDir?: string;
  /** Reference date used for expiry checks. Defaults to `new Date()`. */
  now?: Date;
  /** Sink for warnings (expired entries). Defaults to `console.warn`. */
  warn?: (message: string) => void;
}

export interface LoadResult {
  /** Active (non-expired, valid) entries — the ones the wrapper applies. */
  active: LoadedEntry[];
  /** Valid-but-expired entries — parsed, warned about, not applied. */
  expired: LoadedEntry[];
}

/** Resolve the repo root from this file's location (tools/test-quarantine/src). */
export function defaultRepoRoot(): string {
  // src/load.ts -> src -> test-quarantine -> tools -> <repo root>.
  // fileURLToPath (not URL.pathname) so the result is a valid native path on
  // Windows (no leading `/C:/…`) and free of percent-encoding.
  return resolve(fileURLToPath(new URL("../../..", import.meta.url)));
}

function defaultRegistryDir(repoRoot: string): string {
  return join(repoRoot, "quarantine");
}

/** Compare two ISO dates by calendar day; an entry is expired the day AFTER expiry. */
function isExpired(expiry: string, now: Date): boolean {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const expiryDate = new Date(`${expiry}T00:00:00.000Z`);
  return today.getTime() > expiryDate.getTime();
}

/**
 * Discover, parse and validate every `quarantine/*.yaml` entry.
 *
 * - Malformed/invalid entries throw loudly (PRD §5.2) — a broken quarantine
 *   must never silently no-op.
 * - Expired entries are returned in `expired` (warned, not applied) per §9.
 */
export function loadRegistry(options: LoadOptions = {}): LoadResult {
  const repoRoot = options.repoRoot ?? defaultRepoRoot();
  const registryDir = options.registryDir ?? defaultRegistryDir(repoRoot);
  const now = options.now ?? new Date();
  const warn = options.warn ?? (msg => console.warn(msg));

  const active: LoadedEntry[] = [];
  const expired: LoadedEntry[] = [];

  if (!existsSync(registryDir)) {
    return { active, expired };
  }

  const files = readdirSync(registryDir)
    .filter(name => name.endsWith(".yaml") || name.endsWith(".yml"))
    .sort();

  for (const name of files) {
    const sourcePath = join(registryDir, name);
    const sourceRelative = relative(repoRoot, sourcePath);

    let raw: unknown;
    try {
      raw = parseYaml(readFileSync(sourcePath, "utf8"));
    } catch (error) {
      throw new Error(
        `Invalid YAML in quarantine entry ${sourceRelative}: ${(error as Error).message}`,
      );
    }

    const parsed = QuarantineEntrySchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map(issue => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("\n");
      throw new Error(`Invalid quarantine entry ${sourceRelative}:\n${issues}`);
    }

    const loaded: LoadedEntry = {
      entry: parsed.data,
      sourcePath,
      sourceRelative,
      titleRegex:
        parsed.data.filter.titlePattern !== undefined
          ? new RegExp(parsed.data.filter.titlePattern)
          : undefined,
    };

    if (isExpired(parsed.data.expiry, now)) {
      warn(
        `[test-quarantine] EXPIRED entry not applied: ${sourceRelative} ` +
          `(expired ${parsed.data.expiry}, owner ${parsed.data.owner}). The test will run normally.`,
      );
      expired.push(loaded);
    } else {
      active.push(loaded);
    }
  }

  return { active, expired };
}

/** Normalize a possibly-absolute path to a repo-relative, forward-slash path. */
export function toRepoRelative(repoRoot: string, filePath: string): string {
  const abs = isAbsolute(filePath) ? filePath : resolve(repoRoot, filePath);
  return relative(repoRoot, abs).split("\\").join("/");
}
