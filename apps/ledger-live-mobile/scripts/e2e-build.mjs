#!/usr/bin/env zx
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { appDir, iosArch, androidArch, configurations } = require("./e2e-binaries.cjs");

$.verbose = true; // everything works like in v7

const platform = argv.platform || argv.p;
const configurationName =
  argv.configuration ||
  argv.c ||
  (platform &&
    `${platform === "ios" ? "ios.sim" : platform === "android" ? "android.emu" : ""}.${argv.production ? "prerelease" : "release"}`);
const selected = configurations[configurationName];

if (!selected || (platform && platform !== "ios" && platform !== "android")) {
  const names = Object.keys(configurations).join(", ");
  console.error(
    `Usage: e2e-build.mjs -c <configuration> | -p <ios|android> [-b] [--production]\nConfigurations: ${names}`,
  );
  process.exit(1);
}

if (selected.platform === "ios") {
  await $({ cwd: appDir })`pnpm exec detox clean-framework-cache`;
  await $({ cwd: appDir })`pnpm exec detox build-framework-cache`;
  await $({ cwd: appDir })`node ./scripts/syncAppVersion.js ios`;
  await $({
    cwd: appDir,
    env: { ...process.env, ENVFILE: selected.envFile },
  })`xcodebuild ARCHS=${iosArch} ONLY_ACTIVE_ARCH=YES -workspace ios/ledgerlivemobile.xcworkspace -scheme ledgerlivemobile -configuration ${selected.xcodeConfiguration} -sdk iphonesimulator -derivedDataPath ios/build`;
} else {
  await $({ cwd: appDir })`node ./scripts/syncAppVersion.js android`;
  await $({
    cwd: `${appDir}/android`,
    env: { ...process.env, ENVFILE: selected.envFile },
  })`./gradlew app:assemble${selected.gradleTaskSuffix} app:assembleAndroidTest -DtestBuildType=${selected.testBuildType} -PreactNativeArchitectures=${androidArch}`;
}
