/**
 * Builds the body of Xray's `POST /api/v2/import/execution`.
 *
 * Pure and framework-agnostic: LWD feeds it from a Playwright reporter, LWM can feed it from
 * Allure results once it moves off `xray.formater.sh`. See QAA-1451.
 */

/** Statuses Xray accepts. A finished run never reports `EXECUTING`, so it is not modelled. */
export type XrayStatus = "PASSED" | "FAILED" | "TODO" | "ABORTED";

export type XrayParameter = { name: string; value: string };

/** A Jira issue key, e.g. `B2CQA-2499`. */
const TEST_KEY_PATTERN = /^[A-Z][A-Z0-9]*-\d+$/;

export type XrayResult = {
  testKey: string;
  status: XrayStatus;
  /** Present → reported as one iteration of a data-driven test rather than a plain result. */
  parameters?: XrayParameter[];
  /** Identifies the producing test, so a retry is told apart from a second test sharing a key. */
  runId?: string;
  /** Failure message, surfaced in Xray so a red row says why it failed. */
  comment?: string;
};

export type XrayIteration = {
  parameters: XrayParameter[];
  status: XrayStatus;
  log?: string;
};
export type XrayTest = {
  testKey: string;
  status: XrayStatus;
  iterations?: XrayIteration[];
  comment?: string;
};
export type XrayInfo = { summary: string; description: string };
export type XrayReport = { testExecutionKey?: string; info?: XrayInfo; tests: XrayTest[] };

/**
 * What counts as "the same result", so a later one replaces it:
 * an iteration is identified by its parameters, so a retry or a `--repeat-each` repeat of the
 * same coin collapses to the final attempt; a plain result is identified by the test that
 * produced it, so two *different* tests declaring one key both contribute instead of
 * overwriting each other.
 */
function identityOf(result: XrayResult): string {
  const discriminator = result.parameters?.length
    ? result.parameters.map(parameter => `${parameter.name}=${parameter.value}`).join(";")
    : (result.runId ?? "");
  return `${result.testKey}\u0000${discriminator}`;
}

function worstOf(statuses: XrayStatus[]): XrayStatus {
  if (statuses.some(status => status === "FAILED" || status === "ABORTED")) return "FAILED";
  if (statuses.some(status => status === "PASSED")) return "PASSED";
  return "TODO";
}

export function buildXrayReport(
  results: readonly XrayResult[],
  options: { testExecutionKey?: string; info?: XrayInfo } = {},
): XrayReport {
  const latest = new Map<string, XrayResult>();
  for (const result of results) {
    if (!TEST_KEY_PATTERN.test(result.testKey)) {
      console.error(`[xray] ignoring invalid test key: ${JSON.stringify(result.testKey)}`);
      continue;
    }
    latest.set(identityOf(result), result);
  }

  const byTestKey = new Map<string, XrayResult[]>();
  for (const result of latest.values()) {
    const group = byTestKey.get(result.testKey);
    if (group) group.push(result);
    else byTestKey.set(result.testKey, [result]);
  }

  const tests: XrayTest[] = [];
  for (const [testKey, group] of byTestKey) {
    const status = worstOf(group.map(result => result.status));
    // Xray rejects an iteration carrying no parameters, so a result without any is reported
    // through `status` alone.
    const iterations = group
      .filter(result => result.parameters?.length)
      .map(result => ({
        parameters: result.parameters!,
        status: result.status,
        ...(result.comment ? { log: result.comment } : {}),
      }));

    if (iterations.length === 0) {
      const comment = group.find(result => result.comment)?.comment;
      tests.push({ testKey, status, ...(comment ? { comment } : {}) });
      continue;
    }
    // Name the failing rows on the parent so the execution says which coins broke without
    // having to expand the iterations.
    const failed = iterations.filter(iteration => iteration.status === "FAILED");
    if (failed.length === 0) {
      tests.push({ testKey, status, iterations });
      continue;
    }
    const rows = failed.map(i => i.parameters.map(p => p.value).join("/")).join(", ");
    tests.push({ testKey, status, iterations, comment: `Failed: ${rows}` });
  }

  // `info` next to an existing `testExecutionKey` overwrites that execution's summary and
  // dates, so the two are mutually exclusive.
  const { testExecutionKey, info } = options;
  if (testExecutionKey) return { testExecutionKey, tests };
  return info ? { info, tests } : { tests };
}
