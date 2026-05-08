import path from "path";
import type { PlaywrightTestArgs, PlaywrightWorkerArgs, TestType } from "@playwright/test";
import { createMatcher } from "../match.js";
import { loadQuarantine } from "../loader.js";

type MatcherState = {
  repoRoot: string;
  match: ReturnType<typeof createMatcher>;
};

let matcherState: MatcherState | undefined;

function getMatcherState(): MatcherState {
  matcherState ??= (() => {
    const { repoRoot, entries } = loadQuarantine();
    return { repoRoot, match: createMatcher(entries) };
  })();
  return matcherState;
}

/**
 * Registers an auto-fixture that skips or annotates tests per root `quarantine/*.yml`.
 */
export function withQuarantine(
  base: TestType<PlaywrightTestArgs, PlaywrightWorkerArgs>,
): TestType<PlaywrightTestArgs & { __quarantine: void }, PlaywrightWorkerArgs> {
  return base.extend<{ __quarantine: void }>({
    __quarantine: [
      async ({}, use, testInfo) => {
        const { repoRoot, match } = getMatcherState();
        const rel = path.relative(repoRoot, testInfo.file);
        if (!rel.startsWith("..")) {
          const posixRel = rel.split(path.sep).join("/");
          const title = testInfo.titlePath.join(" > ");
          const entry = match({ file: posixRel, title });
          if (entry) {
            if (entry.failureMode === "skip") {
              testInfo.skip(
                true,
                `Quarantine [${entry.id}] (${entry.team}, expires ${entry.expiry}): ${entry.reason}`,
              );
            } else {
              testInfo.annotations.push({
                type: "quarantine",
                description: `optional:${entry.id}:${entry.reason}`,
              });
            }
          }
        }
        await use();
      },
      { auto: true },
    ],
  });
}
