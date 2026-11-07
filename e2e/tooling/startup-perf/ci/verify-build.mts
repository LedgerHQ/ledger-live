#!/usr/bin/env node
// Checks after the build that the binary is the prepared prod-like build. See README.md.
//
//   node verify-build.mts android <apk> [app_dir]
//   node verify-build.mts ios <ledgerlivemobile.app> [app_dir]
//
// Prints counts only, never env values (the generated config also holds API keys).
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  countLines,
  insideWorkingDir,
  linesOf,
  runStep,
  StepFailure,
  toolOutput,
} from "./step.mts";

/** Lines with each marker, as `grep -c` counts them. */
export interface BuildCounts {
  mock: number;
  detox: number;
  /** FORCE_DEBUG_VISIBLE=1, without which Maestro cannot open Debug. */
  debug: number;
  blurMock: number;
  blurReal: number;
}

type Matcher = (line: string) => boolean;
type ConfigMarkers = Record<"mock" | "detox" | "debug", Matcher>;

const containing =
  (text: string): Matcher =>
  line =>
    line.includes(text);

// dotenv.gradle turns every key into a BuildConfig field and a string resValue.
export const BUILD_CONFIG_MARKERS: ConfigMarkers = {
  mock: line => /\sString MOCK = /.test(line),
  detox: line => /\sString DETOX = /.test(line),
  debug: containing('String FORCE_DEBUG_VISIBLE = "1";'),
};
export const RES_VALUES_MARKERS: ConfigMarkers = {
  mock: containing('<string name="MOCK"'),
  detox: containing('<string name="DETOX"'),
  debug: containing('<string name="FORCE_DEBUG_VISIBLE"'),
};
export const DOT_ENV_MARKERS: ConfigMarkers = {
  mock: containing('@"MOCK":'),
  detox: containing('@"DETOX":'),
  debug: containing('@"FORCE_DEBUG_VISIBLE":@"1"'),
};

export function countMarkers(config: string, markers: ConfigMarkers, bundle: string): BuildCounts {
  const configLines = linesOf(config);
  const bundleLines = linesOf(bundle);
  return {
    mock: countLines(configLines, markers.mock),
    detox: countLines(configLines, markers.detox),
    debug: countLines(configLines, markers.debug),
    blurMock: countLines(bundleLines, containing("BlurViewMock")),
    blurReal: countLines(bundleLines, containing("ReactNativeBlurView")),
  };
}

/** The first problem of the build, or the warning to give when there is none. */
export function judge(counts: BuildCounts): { error: string | null; warning: string | null } {
  if (counts.debug < 1) {
    return {
      error: "FORCE_DEBUG_VISIBLE=1 is not in the generated config: Maestro cannot open Debug",
      warning: null,
    };
  }
  if (counts.mock !== 0 || counts.detox !== 0) {
    return { error: "MOCK or DETOX is still in the generated config", warning: null };
  }
  if (counts.blurMock !== 0) {
    return { error: "the JS bundle still has the E2E blur mock", warning: null };
  }
  const warning =
    counts.blurReal < 1
      ? "no ReactNativeBlurView string in the bundle: check the marker before trusting the blur check"
      : null;
  return { error: null, warning };
}

// Byte for byte, as grep -a reads it: the Android bundle may be Hermes bytecode.
const readBytes = (file: string) => readFileSync(file, "latin1");

function androidCounts(apk: string, app: string): BuildCounts {
  const generated = path.join(app, "android/app/build/generated");
  const buildConfig = path.join(
    generated,
    "source/buildConfig/detoxPreRelease/com/ledger/live/BuildConfig.java",
  );
  const resValues = path.join(
    generated,
    "res/resValues/detoxPreRelease/values/gradleResValues.xml",
  );
  let config: { file: string; markers: ConfigMarkers };
  if (existsSync(buildConfig)) config = { file: buildConfig, markers: BUILD_CONFIG_MARKERS };
  else if (existsSync(resValues)) config = { file: resValues, markers: RES_VALUES_MARKERS };
  else throw new StepFailure(`neither ${buildConfig} nor ${resValues} found`);
  try {
    toolOutput("unzip", ["-l", apk, "assets/index.android.bundle"]);
  } catch {
    throw new StepFailure(`no JS bundle in ${apk}`);
  }
  const bundle = toolOutput("unzip", ["-p", apk, "assets/index.android.bundle"], "latin1");
  return countMarkers(readBytes(config.file), config.markers, bundle);
}

function iosCounts(appBundle: string, app: string): BuildCounts {
  const reactNativeConfig = path.dirname(
    createRequire(path.join(app, "package.json")).resolve("react-native-config/package.json"),
  );
  const dotEnv = path.join(reactNativeConfig, "ios/ReactNativeConfig/GeneratedDotEnv.m");
  if (!existsSync(dotEnv)) throw new StepFailure(`${dotEnv} not found`);
  const bundle = path.join(appBundle, "main.jsbundle");
  if (!existsSync(bundle)) throw new StepFailure(`${bundle} not found`);
  return countMarkers(readBytes(dotEnv), DOT_ENV_MARKERS, readBytes(bundle));
}

function verify(platform: string, artifact: string, app: string): void {
  const index = path.join(app, "src/index.tsx");
  if (!existsSync(index) || !readFileSync(index, "utf8").includes("startup-perf prod-like")) {
    throw new StepFailure("the checkout was not prepared (prepare-build.mts)");
  }
  let counts: BuildCounts;
  if (platform === "android") counts = androidCounts(artifact, app);
  else if (platform === "ios") counts = iosCounts(artifact, app);
  else throw new StepFailure(`unknown platform ${platform}`);
  console.log(
    `config: MOCK lines=${counts.mock} DETOX lines=${counts.detox} FORCE_DEBUG_VISIBLE=1 lines=${counts.debug}; bundle: BlurViewMock=${counts.blurMock} ReactNativeBlurView=${counts.blurReal}`,
  );
  const { error, warning } = judge(counts);
  if (error) throw new StepFailure(error);
  if (warning) console.log(`::warning::${warning}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [platform = "", artifact = "", app = "apps/ledger-live-mobile"] = process.argv.slice(2);
  await runStep(`verify-build (${platform})`, () => {
    if (!platform || !artifact) {
      throw new StepFailure("usage: verify-build.mts android|ios <apk or .app> [app_dir]");
    }
    verify(platform, insideWorkingDir(artifact), insideWorkingDir(app));
  });
}
