import type { QuarantineEntry } from "../schema.js";
import type { MatcherState } from "./matcherState.js";
import { buildTitleFromAncestorTitles, buildTitleFromCircusTest, toRepoRelativeFile } from "./testIdentity.js";

type NamedNode = {
  name: string;
  parent?: NamedNode;
};

export function matchCircusTest(
  state: MatcherState,
  absoluteTestPath: string,
  test: NamedNode,
): QuarantineEntry | undefined {
  const file = toRepoRelativeFile(state.repoRoot, absoluteTestPath);
  if (!file) {
    return undefined;
  }
  const title = buildTitleFromCircusTest(test);
  return state.match({ file, title });
}

export function matchJestAssertion(
  state: MatcherState,
  absoluteTestPath: string,
  ancestorTitles: string[],
  title: string,
): QuarantineEntry | undefined {
  const file = toRepoRelativeFile(state.repoRoot, absoluteTestPath);
  if (!file) {
    return undefined;
  }
  const fullTitle = buildTitleFromAncestorTitles(ancestorTitles, title);
  return state.match({ file, title: fullTitle });
}
