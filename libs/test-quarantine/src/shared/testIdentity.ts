import path from "path";

const TITLE_SEPARATOR = " > ";

type NamedNode = {
  name: string;
  parent?: NamedNode;
};

/**
 * Full title using the same ` > ` separator as Playwright `titlePath`.
 */
export function buildTitleFromCircusTest(test: NamedNode): string {
  const parts: string[] = [];
  let node: NamedNode | undefined = test;
  while (node) {
    if (node.name) {
      parts.unshift(node.name);
    }
    node = node.parent;
  }
  return parts.join(TITLE_SEPARATOR);
}

export function buildTitleFromAncestorTitles(ancestorTitles: string[], title: string): string {
  return [...ancestorTitles, title].join(TITLE_SEPARATOR);
}

export function toRepoRelativeFile(
  repoRoot: string | undefined,
  absoluteTestPath: string | undefined,
): string | undefined {
  if (!repoRoot || !absoluteTestPath) {
    return undefined;
  }
  const rel = path.relative(path.resolve(repoRoot), path.resolve(absoluteTestPath));
  if (rel.startsWith("..")) {
    return undefined;
  }
  return rel.split(path.sep).join("/");
}

export function formatQuarantineSkipMessage(entry: {
  id: string;
  team: string;
  expiry: string;
  reason: string;
}): string {
  return `Quarantine [${entry.id}] (${entry.team}, expires ${entry.expiry}): ${entry.reason}`;
}
