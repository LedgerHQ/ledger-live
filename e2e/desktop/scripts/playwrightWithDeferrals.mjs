#!/usr/bin/env node
/**
 * Runs `playwright test` with the given arguments, then runs again, in later passes, the tests
 * that were skipped because their broadcast locks were busy (see tests/utils/broadcastLock.ts).
 * Ends with the passed/failed/flaky/skipped counts of all passes, which CI reads.
 */
import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { runWithDeferralPasses } = require("@ledgerhq/live-e2e-shared/broadcastLock/deferralPasses");

// Mirror tests/utils/broadcastDeferrals.ts.
const BROADCAST_DEFERRAL_REPORT_ENV = "E2E_BROADCAST_DEFERRAL_REPORT";
const BROADCAST_LOCK_DEFERRED_REASON =
  "[broadcastLock] moved to a later pass: its broadcast locks are busy";

const ALLURE_RESULTS_DIR = "allure-results";
const OUTPUT_OPTION = "--output";
const LAST_RUN_FILE_OPTION = "--last-failed-file";
const LAST_RUN_FILE_ENV = "PLAYWRIGHT_LAST_RUN_OUTPUT_FILE";
const INTERACTIVE_OPTIONS = new Set(["--list", "--ui", "--debug", "--help", "-h"]);
// Would run more than the deferred tests again, send some of them to another CI machine, or
// clear the first pass's artifacts and failures, which a later pass writes aside instead.
const FIRST_PASS_ONLY_OPTIONS = new Set([
  "--shard",
  "--last-failed",
  OUTPUT_OPTION,
  LAST_RUN_FILE_OPTION,
]);
const OPTIONS_WITH_A_SEPARATE_VALUE = new Set(["--shard", OUTPUT_OPTION, LAST_RUN_FILE_OPTION]);

const args = process.argv.slice(2);
const DEFERRAL_REPORTER = fileURLToPath(
  new URL("../tests/reporters/broadcastDeferralReporter.ts", import.meta.url),
);
// A --reporter option replaces the configured reporters, this one included.
const testArgs = args.map((arg, index) =>
  arg.startsWith("--reporter=") || args[index - 1] === "--reporter"
    ? `${arg},${DEFERRAL_REPORTER}`
    : arg,
);
// A later pass runs each deferred test once, so every repeat waits for its locks instead.
const repeatsEachTest = args.some(arg => arg.split("=")[0] === "--repeat-each");
const playwrightCli = require.resolve("@playwright/test/cli");

const runPlaywright = (playwrightArgs, env = process.env) =>
  spawnSync(process.execPath, [playwrightCli, "test", ...playwrightArgs], { stdio: "inherit", env })
    .status ?? 1;

const laterPassArgs = testArgs.filter((arg, index) => {
  const option = arg.split("=")[0];
  const previous = testArgs[index - 1];
  const isValueOfDroppedOption =
    OPTIONS_WITH_A_SEPARATE_VALUE.has(previous) && !arg.startsWith("-");
  return !FIRST_PASS_ONLY_OPTIONS.has(option) && !isValueOfDroppedOption;
});

const readJson = async file => JSON.parse(await readFile(file, "utf8"));

const dropDeferredAllureResults = async () => {
  const files = await readdir(ALLURE_RESULTS_DIR).catch(() => []);
  const results = files.filter(file => file.endsWith("-result.json"));
  await Promise.all(
    results.map(async file => {
      const resultPath = path.join(ALLURE_RESULTS_DIR, file);
      const result = await readJson(resultPath).catch(() => undefined);
      const deferred =
        result?.status === "skipped" &&
        result.statusDetails?.message === BROADCAST_LOCK_DEFERRED_REASON;
      if (deferred) await rm(resultPath, { force: true });
    }),
  );
};

const lastRunFileOption = () => {
  const index = args.findIndex(arg => arg.split("=")[0] === LAST_RUN_FILE_OPTION);
  if (index === -1) return undefined;
  const option = args[index];
  return option.includes("=") ? option.slice(option.indexOf("=") + 1) : args[index + 1];
};

/** The .last-run.json Playwright wrote for the first pass, as it resolves it. */
const firstPassLastRunFile = outputDir => {
  const file =
    lastRunFileOption() ??
    process.env[LAST_RUN_FILE_ENV] ??
    (outputDir && path.join(outputDir, ".last-run.json"));
  return file && path.resolve(file);
};

/**
 * Playwright rewrites .last-run.json on each run, so later passes write theirs aside, then their
 * failures join the first pass's, for a later --last-failed run.
 */
const mergeLastRuns = async (firstPassFile, laterPassFiles) => {
  if (!firstPassFile || laterPassFiles.length === 0) return;
  const [firstPass, ...laterPasses] = await Promise.all(
    [firstPassFile, ...laterPassFiles].map(file => readJson(file).catch(() => undefined)),
  );
  if (!firstPass) return;
  const passes = [firstPass, ...laterPasses.filter(Boolean)];
  const lastRun = {
    status: passes.find(pass => pass.status !== "passed")?.status ?? "passed",
    failedTests: [...new Set(passes.flatMap(pass => pass.failedTests ?? []))],
  };
  await writeFile(firstPassFile, JSON.stringify(lastRun, undefined, 2));
};

const runPasses = async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "playwright-deferrals-"));
  const totals = { passed: 0, failed: 0, flaky: 0, skipped: 0 };
  let notRun = 0;
  let everyPassReported = true;
  let firstPassOutputDir;
  const laterPassLastRuns = [];

  const runPass = async ({ number, items, env }) => {
    let passArgs = testArgs;
    const passEnv = { ...process.env, ...env };
    if (items) {
      console.log(`\nPass ${number}: ${items.length} test(s) whose broadcast locks were busy`);
      const testList = path.join(workDir, `pass-${number}.tests`);
      await writeFile(testList, items.flatMap(item => item.testListLines).join("\n"));
      passArgs = [...laterPassArgs, "--test-list", testList];
      if (firstPassOutputDir) {
        passArgs.push(OUTPUT_OPTION, path.join(firstPassOutputDir, `pass-${number}`));
      }
      passEnv[LAST_RUN_FILE_ENV] = path.join(workDir, `pass-${number}.last-run.json`);
      laterPassLastRuns.push(passEnv[LAST_RUN_FILE_ENV]);
    }
    const reportFile = path.join(workDir, `pass-${number}.json`);
    const exitCode = runPlaywright(passArgs, {
      ...passEnv,
      [BROADCAST_DEFERRAL_REPORT_ENV]: reportFile,
    });
    await dropDeferredAllureResults();
    const report = await readJson(reportFile).catch(() => undefined);
    if (!report) {
      everyPassReported = false;
      return { exitCode, deferred: [] };
    }
    if (!items) firstPassOutputDir = report.outputDir;
    for (const outcome of Object.keys(totals)) totals[outcome] += report.counts[outcome] ?? 0;
    const notSelected = (items ?? []).filter(item => !report.selected.includes(item.id));
    if (notSelected.length > 0) {
      notRun += notSelected.length;
      console.error(
        `\nPass ${number} could not select ${notSelected.length} deferred test(s):\n${notSelected.map(item => `  ${item.id}`).join("\n")}`,
      );
    }
    return { exitCode: exitCode || Number(notSelected.length > 0), deferred: report.deferred };
  };

  try {
    const exitCode = await runWithDeferralPasses(runPass, repeatsEachTest ? 0 : undefined);
    await mergeLastRuns(firstPassLastRunFile(firstPassOutputDir), laterPassLastRuns);
    if (everyPassReported) {
      console.log("\nAll passes:");
      for (const [outcome, count] of Object.entries(totals)) console.log(`  ${count} ${outcome}`);
      if (notRun > 0) console.log(`  ${notRun} did not run`);
    }
    return exitCode;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
};

process.exitCode = args.some(arg => INTERACTIVE_OPTIONS.has(arg))
  ? runPlaywright(args)
  : await runPasses();
