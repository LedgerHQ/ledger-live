#!/usr/bin/env zx
import { basename } from "path";

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
const bundle_ios_minified = async () => {
  await $`pnpm mobile bundle:ios --dev false --minify true --bundle-output main.jsbundle.minified`;
};

const bundle_android_minified = async () => {
  await $`pnpm mobile bundle:android --dev false --minify true --bundle-output main.jsbundle.minified`;
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
      --loglevel error \
      --record-logs failing \
      --take-screenshots failing \
      --forceExit \
      --headless \
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
      --loglevel error \\
      --record-logs failing \\
      --take-screenshots failing \\
      --forceExit \\
      --headless \\
      --cleanup \\
      ${filteredArgs}`.nothrow();
  process.exitCode = result.exitCode;
};

const getTasksFrom = {
  ios: {
    build: build_ios,
    bundle: async () => (cache ? await bundle_ios_with_cache() : await bundle_ios()),
    bundleSize: bundle_ios_minified,
    test: test_ios,
  },
  android: {
    build: build_android,
    bundle: async () => await bundle_android(),
    bundleSize: bundle_android_minified,
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
  filteredArgs.push("--runInBand");
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
    await getTasksFrom[platform].test();
  }
});
