/**
 * Entry bodies are free-form markdown lifted from changeset files and PR
 * descriptions, so a `## ` line can legitimately appear inside a fenced code
 * block. Splitting tracks fences and only treats a semver `## ` heading at
 * column 0 as a section boundary.
 */

export const VERSION_HEADING = /^## \d+\.\d+\.\d+(?:[-+][0-9A-Za-z.\-+]+)?\s*$/;

const FENCE = /^(`{3,}|~{3,})/;

export type SplitChangelog = {
  /** Everything before the first version section, e.g. `# @ledgerhq/foo`. */
  header: string;
  /** Version sections, newest first. Each starts with its own `## <version>` line. */
  sections: string[];
};

export function splitChangelog(text: string): SplitChangelog {
  const headerLines: string[] = [];
  const sections: string[][] = [];
  let current: string[] | null = null;
  let fence: string | null = null;

  for (const line of text.split("\n")) {
    const fenceMatch = FENCE.exec(line);
    if (fenceMatch) {
      if (fence === null) fence = fenceMatch[1];
      else if (line.startsWith(fence)) fence = null;
    } else if (fence === null && VERSION_HEADING.test(line)) {
      if (current) sections.push(current);
      current = [];
    }
    (current ?? headerLines).push(line);
  }
  if (current) sections.push(current);

  return {
    header: headerLines.join("\n"),
    sections: sections.map(lines => lines.join("\n")),
  };
}

/** Inverse of {@link splitChangelog} for any changelog with a `# name` header. */
export function joinChangelog({ header, sections }: SplitChangelog): string {
  return [header, ...sections].join("\n");
}

export function hasValidHeader(header: string): boolean {
  return header.startsWith("# ");
}
