#!/usr/bin/env zx
import { basename, join } from "path";
import { spawn } from "node:child_process";

let platform, test, build, bundle, bundleSize;
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

/**
 * A jest worker whose event loop freezes hangs the whole shard until CI's
 * `timeout-minutes` kills it (QAA-1365): every timeout that could end the run
 * lives on that same loop. The watchdog watches the heartbeats written by
 * e2e/mobile/helpers/stallHeartbeat.ts and SIGKILLs a frozen worker, after which
 * jest attributes the failure to that spec and Detox retries it.
 *
 * It runs beside Detox rather than in the workflow so local runs are covered too.
 * Set E2E_STALL_WATCHDOG=0 to disable it.
 */
const startStallWatchdog = repoRoot => {
  if (process.env.E2E_STALL_WATCHDOG === "0") return undefined;

  const heartbeatDir = join(repoRoot, "e2e/mobile/artifacts/.heartbeats");
  // Exported so the jest workers, which inherit this environment, agree on the path.
  process.env.E2E_HEARTBEAT_DIR = heartbeatDir;

  try {
    const child = spawn(
      process.execPath,
      [
        join(repoRoot, "e2e/mobile/scripts/stall-watchdog.mjs"),
        "--dir",
        heartbeatDir,
        // Only workers descending from this process may ever be killed: these are
        // shared self-hosted runners.
        "--root-pid",
        String(process.pid),
      ],
      { stdio: "inherit" },
    );
    child.unref();
    return child;
  } catch (error) {
    // Never let the watchdog be the reason a shard does not run.
    console.warn(`[stall-watchdog] could not start: ${error}`);
    return undefined;
  }
};

const usage = (exitCode = 1) => {
  console.log(
    `Usage: ${basename(
      __filename,
    )} -p --platform <ios|android> [-h --help]  [-t --test] [-b --build] [--bundle] [--bundle-size] [--cache | --no-cache] [--testType] [--shard] [--production]`,
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

// Minified bundle for size reporting (not used for E2E tests)
const minify_existing_bundle = async () => {
  await $`pnpm mobile minify:bundle`;
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

const test_ios = async () => {
  const result = await $`pnpm mobile ${testType}:test\
      -c ios.sim.${target} \
      --loglevel warn \
      --record-logs failing \
      --take-screenshots failing \
      --forceExit \
      --headless \
      --retries ${testType === "mock" ? 1 : 2} \
      --cleanup \
      ${filteredArgs}`.nothrow();
  process.exitCode = result.exitCode;
};

const build_android = async () => {
  await $`pnpm mobile e2e:build -c android.emu.${target}`;
};

const test_android = async () => {
  const result = await $`pnpm mobile ${testType}:test \\
      -c android.emu.${target} \\
      --loglevel warn \\
      --record-logs failing \\
      --take-screenshots failing \\
      --forceExit \\
      --headless \\
      --retries ${testType === "mock" ? 1 : 2} \\
      --cleanup \\
      ${filteredArgs}`.nothrow();
  process.exitCode = result.exitCode;
};

const getTasksFrom = {
  ios: {
    build: build_ios,
    bundle: async () => (cache ? await bundle_ios_with_cache() : await bundle_ios()),
    bundleSize: minify_existing_bundle,
    test: test_ios,
  },
  android: {
    build: build_android,
    bundle: async () => await bundle_android(),
    bundleSize: minify_existing_bundle,
    test: test_android,
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
    case "bundle-size":
      bundleSize = true;
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

if (outputFile) {
  filteredArgs.push("--json");
  filteredArgs.push(`--outputFile=${outputFile}`);
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
  if (bundleSize) {
    await getTasksFrom[platform].bundleSize();
  }
  if (test) {
    const watchdog = startStallWatchdog(process.cwd());
    try {
      await getTasksFrom[platform].test();
    } finally {
      watchdog?.kill("SIGTERM");
    }
  }
});
