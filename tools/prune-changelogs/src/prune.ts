import { hasValidHeader, joinChangelog, splitChangelog } from "./split.ts";

/** Stable token so the footer stays strippable even if its wording changes. */
export const FOOTER_TOKEN = "changelog-pruned";

export const FOOTER =
  `<!-- ${FOOTER_TOKEN}: older entries were removed to keep this file small. ` +
  "Full history is in `git log -p CHANGELOG.md` and in the GitHub release for each version. -->";

export type PruneOutcome =
  | {
      changed: false;
      reason: "under-limit" | "malformed-header" | "no-saving";
      text: string;
      sections: number;
    }
  | {
      changed: true;
      text: string;
      kept: number;
      dropped: number;
      bytesBefore: number;
      bytesAfter: number;
      /** Byte-exact regions that must survive formatting, or merges will conflict. */
      header: string;
      newestSection: string;
    };

export function stripFooter(text: string): string {
  return text
    .split("\n")
    .filter(line => !(line.trimStart().startsWith("<!--") && line.includes(FOOTER_TOKEN)))
    .join("\n");
}

/**
 * Keeps the newest `keep` version sections and drops the rest.
 *
 * Old entries are deleted rather than archived: an archive file would be
 * re-sent in full on every commit that appends to it, which is the problem
 * this exists to solve.
 */
export function pruneChangelog(text: string, keep: number): PruneOutcome {
  if (!Number.isInteger(keep) || keep < 1) {
    throw new RangeError(`keep must be a positive integer, received ${keep}`);
  }

  const split = splitChangelog(stripFooter(text));

  if (!hasValidHeader(split.header)) {
    return { changed: false, reason: "malformed-header", text, sections: split.sections.length };
  }
  if (split.sections.length <= keep) {
    return { changed: false, reason: "under-limit", text, sections: split.sections.length };
  }

  const kept = split.sections.slice(0, keep);
  const body = joinChangelog({ header: split.header, sections: kept }).trimEnd();
  const next = `${body}\n\n${FOOTER}\n`;

  if (!next.startsWith(split.header)) {
    throw new Error("prune dropped the changelog header");
  }
  if (!next.includes(kept[0].trimEnd())) {
    throw new Error("prune altered the newest changelog entry");
  }

  // Skip on short changelogs
  if (next.length >= text.length) {
    return { changed: false, reason: "no-saving", text, sections: split.sections.length };
  }

  return {
    changed: true,
    text: next,
    kept: kept.length,
    dropped: split.sections.length - kept.length,
    bytesBefore: text.length,
    bytesAfter: next.length,
    header: split.header,
    newestSection: kept[0].trimEnd(),
  };
}
