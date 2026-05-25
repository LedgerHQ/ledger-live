import type { PlaywrightTestArgs, PlaywrightWorkerArgs, TestType } from "@playwright/test";
import { getMatcherState } from "../shared/matcherState.js";
import { formatQuarantineSkipMessage, toRepoRelativeFile } from "../shared/testIdentity.js";

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
        const posixRel = toRepoRelativeFile(repoRoot, testInfo.file);
        if (posixRel) {
          const title = testInfo.titlePath.join(" > ");
          const entry = match({ file: posixRel, title });
          if (entry) {
            if (entry.failureMode === "skip") {
              testInfo.skip(true, formatQuarantineSkipMessage(entry));
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
