#!/usr/bin/env zx
import { createRequire } from "node:module";
import { basename } from "node:path";

let platform;
let target = "release";
let outputFile = "";

$.verbose = true; // everything works like in v7

const usage = (exitCode = 1) => {
  console.error(
    `Usage: ${basename(import.meta.url)} -p <ios|android> [--production] [--outputFile <file>] [spec ...]`,
  );
  process.exit(exitCode);
};

const E2E_DIR = path.resolve(__dirname, "..");
// Mirror LOCK_DEFERRALS_DIR and EXCLUSIVE_LOCK_WAITS_DIR in e2e/mobile/utils/lockDeferrals.ts.
const LOCK_DEFERRALS_DIR = path.join(E2E_DIR, "artifacts/lock-deferrals");
const EXCLUSIVE_LOCK_WAITS_DIR = path.join(E2E_DIR, "artifacts/exclusive-lock-waits");

// Loaded only to run tests: the build and bundle tasks run before the lib is built.
const loadDeferralPasses = () =>
  createRequire(import.meta.url)("@ledgerhq/live-e2e-shared/exclusiveLock/deferralPasses");

const takeDeferredSpecs = async () => {
  const markers = await fs.readdir(LOCK_DEFERRALS_DIR).catch(() => []);
  const specs = await Promise.all(
    markers.map(marker => fs.readFile(path.join(LOCK_DEFERRALS_DIR, marker), "utf8")),
  );
  await fs.remove(LOCK_DEFERRALS_DIR);
  return [...new Set(specs)];
};

const takeExclusiveLockWaits = async () => {
  const markers = await fs.readdir(EXCLUSIVE_LOCK_WAITS_DIR).catch(() => []);
  const waits = await Promise.all(
    markers.map(marker =>
      fs.readJson(path.join(EXCLUSIVE_LOCK_WAITS_DIR, marker)).catch(() => undefined),
    ),
  );
  await fs.remove(EXCLUSIVE_LOCK_WAITS_DIR);
  return new Map(waits.filter(Boolean).map(({ spec, waitedMs }) => [spec, waitedMs]));
};

const passOutputFile = pass => outputFile.replace(/(\.json)?$/, `.pass-${pass}.json`);

// Jest resolves --outputFile from e2e/mobile.
const fromE2eDir = file => path.resolve(E2E_DIR, file);

const countResults = testResults => {
  const tests = testResults.flatMap(file => file.assertionResults ?? []);
  const countTests = status => tests.filter(test => test.status === status).length;
  const countSuites = status => testResults.filter(file => file.status === status).length;
  const failedSuites = countSuites("failed");
  const pendingSuites = countSuites("skipped");
  return {
    numTotalTestSuites: testResults.length,
    numFailedTestSuites: failedSuites,
    numPendingTestSuites: pendingSuites,
    numPassedTestSuites: testResults.length - failedSuites - pendingSuites,
    numRuntimeErrorTestSuites: testResults.filter(
      file =>
        file.status === "failed" &&
        !(file.assertionResults ?? []).some(test => test.status === "failed"),
    ).length,
    numTotalTests: tests.length,
    numPassedTests: countTests("passed"),
    numFailedTests: countTests("failed"),
    numPendingTests: countTests("pending") + countTests("skipped"),
    numTodoTests: countTests("todo"),
    success: failedSuites === 0,
  };
};

// Folded in as each pass ends, without the specs it deferred or the time specs waited for broadcast
// locks, so neither skews the shard timings; a pass that never finishes leaves no skipped stub.
const foldPassOutput = async (pass, deferredSpecs, lockWaits) => {
  const output = await fs.readJson(fromE2eDir(passOutputFile(pass))).catch(() => undefined);
  if (!output) return;
  const previous =
    pass === 1 ? undefined : await fs.readJson(fromE2eDir(outputFile)).catch(() => undefined);
  const resultsBySpec = new Map((previous?.testResults ?? []).map(result => [result.name, result]));
  const deferred = new Set(deferredSpecs);
  for (const result of output.testResults) {
    if (deferred.has(result.name)) continue;
    const waitedMs = lockWaits.get(result.name);
    const startTime = waitedMs && Math.min(result.endTime, result.startTime + waitedMs);
    resultsBySpec.set(result.name, startTime ? { ...result, startTime } : result);
  }
  const testResults = [...resultsBySpec.values()];
  await fs.writeJson(fromE2eDir(outputFile), {
    ...output,
    ...countResults(testResults),
    testResults,
  });
};

const testOn = (configuration, args, env) =>
  $({ cwd: E2E_DIR, env })`pnpm exec detox test\
      -c ${configuration} \
      --loglevel warn \
      --record-logs failing \
      --take-screenshots failing \
      --forceExit \
      --headless \
      --retries 1 \
      ${args}`.nothrow();

const testWithLockDeferrals = async specArgs => {
  const { lockDeferralPasses, runWithDeferralPasses } = loadDeferralPasses();
  await fs.remove(LOCK_DEFERRALS_DIR);
  await fs.remove(EXCLUSIVE_LOCK_WAITS_DIR);
  const configuration = `${platform === "ios" ? "ios.sim" : "android.emu"}.${target}`;
  const runPass = async ({ number, mayDefer, items, env }) => {
    if (items) {
      console.log(`Pass ${number}: ${items.length} spec(s) whose broadcast accounts were busy`);
    }
    const outputArgs = outputFile ? ["--json", `--outputFile=${passOutputFile(number)}`] : [];
    const result = await testOn(configuration, [...(items ?? specArgs), ...outputArgs], {
      ...process.env,
      ...env,
    });
    const deferred = mayDefer ? await takeDeferredSpecs() : [];
    const lockWaits = await takeExclusiveLockWaits();
    if (outputFile) await foldPassOutput(number, deferred, lockWaits);
    return { exitCode: result.exitCode, deferred };
  };
  process.exitCode = await runWithDeferralPasses(runPass, lockDeferralPasses());
};

for (const argName in argv) {
  switch (argName) {
    case "help":
    case "h":
      usage(0);
      break;
    case "platform":
    case "p":
      if (argv[argName] !== "ios" && argv[argName] !== "android") {
        usage(1);
      } else {
        platform = argv[argName];
      }
      break;
    case "production":
      target = "prerelease";
      process.env.LEDGER_SYNC_ENVIRONMENT ??= "PROD";
      break;
    case "outputFile":
    case "o":
      outputFile = argv[argName];
      break;
    case "_":
    case "$0":
    /* legacy arguments */
    case "test":
    case "t":
    case "e2e":
      break;
    default:
      usage(42);
      break;
  }
}

const consumedArgs = new Set(["ios", "android", outputFile].filter(Boolean));
const specArgs = process.argv.slice(2).filter(arg => {
  return !arg.startsWith("-") && !consumedArgs.has(arg) && !arg.endsWith(".mjs");
});

if (!platform) {
  usage(2);
}

await testWithLockDeferrals(specArgs);
