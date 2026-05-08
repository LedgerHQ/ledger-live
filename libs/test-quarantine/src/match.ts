import path from "path";
import picomatch from "picomatch";
import type { QuarantineEntry } from "./schema.js";

function normalizePathSeparators(p: string): string {
  return p.split(path.sep).join("/");
}

function parseTitleMatcher(title: string): { kind: "substring"; value: string } | { kind: "regex"; re: RegExp } {
  const m = title.match(/^\/(.+)\/([a-z]*)$/);
  if (m) {
    return { kind: "regex", re: new RegExp(m[1], m[2] ?? "") };
  }
  return { kind: "substring", value: title };
}

function titleMatches(filterTitle: string, fullTitle: string): boolean {
  const matcher = parseTitleMatcher(filterTitle);
  if (matcher.kind === "regex") {
    return matcher.re.test(fullTitle);
  }
  return fullTitle.includes(matcher.value);
}

function filesMatch(filesGlob: string, repoRelativeFile: string): boolean {
  const normalized = normalizePathSeparators(repoRelativeFile);
  return picomatch.isMatch(normalized, filesGlob, { dot: true });
}

export type MatchInput = {
  /** Path relative to monorepo root, POSIX separators */
  file: string;
  /** Full test title including describe chain */
  title: string;
};

/**
 * Returns the first quarantine entry that matches `input` (stable directory order).
 */
export function createMatcher(entries: QuarantineEntry[]) {
  return function match(input: MatchInput): QuarantineEntry | undefined {
    for (const entry of entries) {
      const { files, title } = entry.filter;
      const fileOk = files === undefined || filesMatch(files, input.file);
      const titleOk = title === undefined || titleMatches(title, input.title);
      if (fileOk && titleOk) {
        return entry;
      }
    }
    return undefined;
  };
}
