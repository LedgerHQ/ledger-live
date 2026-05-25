import { createMatcher } from "../match.js";
import { loadQuarantine } from "../loader.js";

export type MatcherState = {
  repoRoot: string;
  match: ReturnType<typeof createMatcher>;
};

let matcherState: MatcherState | undefined;

export function getMatcherState(): MatcherState {
  matcherState ??= (() => {
    const { repoRoot, entries } = loadQuarantine();
    return { repoRoot, match: createMatcher(entries) };
  })();
  return matcherState;
}

/** @internal Test-only reset */
export function resetMatcherStateForTests(): void {
  matcherState = undefined;
}
