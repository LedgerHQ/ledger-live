#!/usr/bin/env zx
import { createRequire } from "module";
import { basename } from "path";

let platform, test, build, bundle;
let testType = "mock";
let cache = true;
let shard = "";
let target = "release";
let filter = "";
let outputFile = "";

$.verbose = true; // everything works like in v7

if (os.platform() === "win32") {
  usePowerShell();
}

const usage = (exitCode = 1) => {
  console.log(
    `Usage: ${basename(
      __filename,
    )} -p --platform <ios|android> [-h --help]  [-t --test] [-b --build] [--bundle] [--cache | --no-cache] [--testType] [--shard] [--production]`,
  );
  process.exit(exitCode);
};

const build_ios = async () => {
  await $`pnpm mobile exec detox clean-framework-cache`;
  await $`pnpm mobile exec detox build-framework-cache`;
  await $`pnpm mobile e2e:build -c ios.sim.${target}`;
};

const bundle_ios = async () => {
  // Hermes doesn't require JS minification - it optimizes during bytecode compilation
  // Using Repack with --minify true causes parsing errors with Hermes
  await $`pnpm mobile bundle:ios --dev false --minify false`;
};

const bundle_android = async () => {
  // Hermes doesn't require JS minification - it optimizes during bytecode compilation
  // Using Repack with --minify true causes parsing errors with Hermes
  await $`pnpm mobile bundle:android --dev false --minify false`;
};

const bundle_ios_with_cache = async () => {
  await bundle_ios();

  await $`pnpm mobile exec detox clean-framework-cache`;
  await $`pnpm mobile exec detox build-framework-cache`;
  within(async () => {
    cd("apps/ledger-live-mobile");
    await $`mkdir -p ios/build/Build/Products/Release-iphonesimulator`;
    await $`cp main.jsbundle ios/build/Build/Products/Release-iphonesimulator/main.jsbundle`;
    // Copy assets if they exist
    await $`mkdir -p ios/build/Build/Products/Release-iphonesimulator/assets`;
    await $`if [ -d "build/assets" ]; then cp -r build/assets/* ios/build/Build/Products/Release-iphonesimulator/assets/ 2>/dev/null || true; fi`;
  });
};

const test_ios = (args, env) =>
  $({ env })`pnpm mobile ${testType}:test\
      -c ios.sim.${target} \
      --loglevel warn \
      --record-logs failing \
      --take-screenshots failing \
      --forceExit \
      --headless \
      --retries 1 \
      ${args}`.nothrow();

const build_android = async () => {
  await $`pnpm mobile e2e:build -c android.emu.${target}`;
};

const test_android = (args, env) =>
  $({ env })`pnpm mobile ${testType}:test \\
      -c android.emu.${target} \\
      --loglevel warn \\
      --record-logs failing \\
      --take-screenshots failing \\
      --forceExit \\
      --headless \\
      --retries 1 \\
      ${args}`.nothrow();

const E2E_DIR = "e2e/mobile";
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

const testWithLockDeferrals = async runTests => {
  const { lockDeferralPasses, runWithDeferralPasses } = loadDeferralPasses();
  await fs.remove(LOCK_DEFERRALS_DIR);
  await fs.remove(EXCLUSIVE_LOCK_WAITS_DIR);
  const runPass = async ({ number, mayDefer, items, env }) => {
    if (items) {
      console.log(`Pass ${number}: ${items.length} spec(s) whose broadcast accounts were busy`);
    }
    const outputArgs = outputFile ? ["--json", `--outputFile=${passOutputFile(number)}`] : [];
    const result = await runTests([...(items ?? filteredArgs), ...outputArgs], {
      ...process.env,
      ...env,
    });
    const deferred = mayDefer ? await takeDeferredSpecs() : [];
    const lockWaits = await takeExclusiveLockWaits();
    if (outputFile) await foldPassOutput(number, deferred, lockWaits);
    return { exitCode: result.exitCode, deferred };
  };
  process.exitCode = await runWithDeferralPasses(
    runPass,
    testType === "e2e" ? lockDeferralPasses() : 0,
  );
};

const getTasksFrom = {
  ios: {
    build: build_ios,
    bundle: async () => (cache ? await bundle_ios_with_cache() : await bundle_ios()),
    test: () => testWithLockDeferrals(test_ios),
  },
  android: {
    build: build_android,
    bundle: async () => await bundle_android(),
    test: () => testWithLockDeferrals(test_android),
  },
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
    case "test":
    case "t":
      test = true;
      break;
    case "build":
    case "b":
      build = true;
      break;
    case "bundle":
      bundle = true;
      break;
    // No-op: still passed by the develop workflows until this change lands there
    case "bundle-size":
      break;
    case "cache":
      cache = argv[argName];
      break;
    case "_":
      break;
    case "e2e":
      testType = "e2e";
      break;
    case "shard":
      shard = argv[argName];
      break;
    case "production":
      target = "prerelease";
      process.env.LEDGER_SYNC_ENVIRONMENT ??= "PROD";
      break;
    case "filter":
      filter = argv[argName];
      break;
    case "outputFile":
    case "o":
      outputFile = argv[argName];
      break;
    default:
      usage(42);
      break;
  }
}

const extraArgs = process.argv.slice(2).filter(arg => !arg.startsWith("-"));
const filteredArgs = extraArgs.filter(arg => {
  return (
    arg !== "./scripts/e2e-ci.mjs" &&
    arg !== "ios" &&
    arg !== "android" &&
    arg !== filter &&
    arg !== shard
  );
});

if (testType === "mock") {
  if (shard) {
    filteredArgs.push("--shard", shard);
  }
}

within(async () => {
  if (!platform) {
    usage(2);
  }

  cd("../../");
  if (build) {
    await getTasksFrom[platform].build();
  }
  if (bundle) {
    await getTasksFrom[platform].bundle();
  }
  if (test) {
    await getTasksFrom[platform].test();
  }
});
