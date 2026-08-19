import { matchGlob } from "./glob.ts";
import type { LoadedEntry } from "./schema.ts";

/**
 * Does an entry's `filter.file` (plain path or glob) match a repo-relative file?
 *
 * A plain path (no `*`/`?`) matches exactly after slash normalisation; a glob
 * is delegated to the shared {@link matchGlob} (Node's `path.matchesGlob`).
 */
export function fileMatches(globOrPath: string, file: string): boolean {
  const normalizedFile = file.split("\\").join("/");
  if (!/[*?]/.test(globOrPath)) {
    return globOrPath.split("\\").join("/") === normalizedFile;
  }
  return matchGlob(globOrPath, normalizedFile);
}

function titleMatches(entry: LoadedEntry, title: string): boolean {
  const { filter } = entry.entry;
  // No title fields -> the whole file is quarantined (PRD §5.2).
  if (filter.title === undefined && filter.titlePattern === undefined) {
    return true;
  }
  if (filter.title !== undefined) {
    return filter.title === title;
  }
  // filter.titlePattern — use the pre-compiled RegExp from LoadedEntry so we
  // avoid constructing a new object on every match call.
  return entry.titleRegex!.test(title);
}

/**
 * Find the quarantine entry matching a resolved `(file, title)`, or undefined.
 *
 * This is the single shared matcher (PRD §5.2) used by both `skip`
 * input-filtering and the `ignore` exit-gate. The first matching entry wins;
 * entries are matched in the order provided (load order = filename sort).
 */
export function matchEntry(
  entries: LoadedEntry[],
  file: string,
  title: string,
): LoadedEntry | undefined {
  return entries.find(
    loaded => fileMatches(loaded.entry.filter.file, file) && titleMatches(loaded, title),
  );
}
