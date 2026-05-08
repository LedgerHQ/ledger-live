import fs from "fs";
import path from "path";
import YAML from "yaml";
import { quarantineEntryFileSchema, type QuarantineEntry } from "./schema.js";
import { findRepoRoot } from "./repoRoot.js";

const ENTRY_FILENAME = /^[A-Za-z0-9_-]+\.(ya?ml)$/;

function isExpired(isoDate: string): boolean {
  const [y, m, d] = isoDate.split("-").map(Number);
  const expiryEndUtc = Date.UTC(y, m - 1, d, 23, 59, 59, 999);
  return Date.now() > expiryEndUtc;
}

export type LoadQuarantineResult = {
  repoRoot: string;
  entries: QuarantineEntry[];
};

/**
 * Loads and validates all `quarantine/*.yml|yaml` at the monorepo root.
 * Entries past `expiry` are dropped with a console warning.
 */
export function loadQuarantine(repoRoot?: string): LoadQuarantineResult {
  const root = repoRoot ?? findRepoRoot();
  const quarantineDir = path.join(root, "quarantine");
  if (!fs.existsSync(quarantineDir)) {
    return { repoRoot: root, entries: [] };
  }

  const names = fs.readdirSync(quarantineDir);
  const expired: string[] = [];
  const entries: QuarantineEntry[] = [];

  for (const name of names) {
    if (!ENTRY_FILENAME.test(name)) {
      continue;
    }
    const fullPath = path.join(quarantineDir, name);
    if (!fs.statSync(fullPath).isFile()) {
      continue;
    }

    const raw = fs.readFileSync(fullPath, "utf8");
    let parsed: unknown;
    try {
      parsed = YAML.parse(raw);
    } catch (e) {
      throw new Error(`[test-quarantine] Invalid YAML in ${fullPath}: ${String(e)}`);
    }

    const parsedResult = quarantineEntryFileSchema.safeParse(parsed);
    if (!parsedResult.success) {
      const msg = parsedResult.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
      throw new Error(`[test-quarantine] Invalid quarantine entry ${fullPath}: ${msg}`);
    }

    const id = path.parse(name).name;
    const entry: QuarantineEntry = { ...parsedResult.data, id };

    if (isExpired(entry.expiry)) {
      expired.push(`${id} (expiry ${entry.expiry})`);
      continue;
    }

    entries.push(entry);
  }

  entries.sort((a, b) => a.id.localeCompare(b.id));

  if (expired.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      `[test-quarantine] Ignoring ${expired.length} expired quarantine entr${expired.length === 1 ? "y" : "ies"}: ${expired.join(", ")}`,
    );
  }

  return { repoRoot: root, entries };
}
