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

const require = createRequire(import.meta.url);
const { runWithDeferralPasses } = require("@ledgerhq/live-e2e-shared/broadcastLock/deferralPasses");

// Mirror tests/utils/broadcastDeferrals.ts.
const BROADCAST_DEFERRAL_REPORT_ENV = "E2E_BROADCAST_DEFERRAL_REPORT";
const BROADCAST_LOCK_DEFERRED_REASON =
  "[broadcastLock] moved to a later pass: its broadcast locks are busy";

const ALLURE_RESULTS_DIR = "allure-results";
const INTERACTIVE_OPTIONS = new Set(["--list", "--ui", "--debug", "--help", "-h"]);
// Would run more than the deferred tests again, or send some of them to another CI machine.
const FIRST_PASS_ONLY_OPTIONS = new Set(["--shard", "--last-failed"]);
const OPTIONS_WITH_A_SEPARATE_VALUE = new Set(["--shard"]);

const args = process.argv.slice(2);
// A later pass runs each deferred test once, so every repeat waits for its locks instead.
const repeatsEachTest = args.some(arg => arg.split("=")[0] === "--repeat-each");
const playwrightCli = require.resolve("@playwright/test/cli");

const runPlaywright = (playwrightArgs, env = process.env) =>
  spawnSync(process.execPath, [playwrightCli, "test", ...playwrightArgs], { stdio: "inherit", env })
    .status ?? 1;

const laterPassArgs = args.filter((arg, index) => {
  const option = arg.split("=")[0];
  const previous = args[index - 1];
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

const runPasses = async () => {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "playwright-deferrals-"));
  const totals = { passed: 0, failed: 0, flaky: 0, skipped: 0 };
  let notRun = 0;
  let everyPassReported = true;

  const runPass = async ({ number, items, env }) => {
    let passArgs = args;
    if (items) {
      console.log(`\nPass ${number}: ${items.length} test(s) whose broadcast locks were busy`);
      const testList = path.join(workDir, `pass-${number}.tests`);
      await writeFile(testList, items.flatMap(item => item.testListLines).join("\n"));
      passArgs = [...laterPassArgs, "--test-list", testList];
    }
    const reportFile = path.join(workDir, `pass-${number}.json`);
    const exitCode = runPlaywright(passArgs, {
      ...process.env,
      ...env,
      [BROADCAST_DEFERRAL_REPORT_ENV]: reportFile,
    });
    await dropDeferredAllureResults();
    const report = await readJson(reportFile).catch(() => undefined);
    if (!report) {
      everyPassReported = false;
      return { exitCode, deferred: [] };
    }
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
