#!/usr/bin/env node
// Makes the checked-out ref's E2E prerelease build prod-like, before `pnpm mobile e2e:build`.
// Run from the repo root: node prepare-build.mts [app_dir]. See README.md.
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  countLines,
  insideWorkingDir,
  linesOf,
  runStep,
  StepFailure,
  summary,
  textOf,
} from "./step.mts";

export const RSPACK_LINE =
  'const isDetoxBuild = process.env.DETOX === "1" || (process.env.ENVFILE || "").includes("mock");';
const RSPACK_PROD_LINE =
  'const isDetoxBuild = process.env.DETOX === "1"; // startup-perf prod-like: no blur mock';
export const BRIDGE_IMPORT = 'import { init } from "~/e2e/bridge/client";';
const LAUNCH_ARGUMENTS_IMPORT = 'import { LaunchArguments } from "react-native-launch-arguments";';
const DETOX_BRIDGE_BLOCK = [
  "  onInitFinished = () => {",
  "    if (Config.DETOX) {",
  "      init();",
  "    }",
  "  };",
];
export const JS_START_LINE = 'logStartupEvent("Before js imports");';
export const STARTUP_END_LINE =
  "  if (!alreadyLogged.has(eventName) && otherStartupEvents.every(e => alreadyLogged.has(e))) {";
export const STARTUP_TRY_LINE = "    try {";
// How an app that logs the startup itself (writeStartupToDeviceLog.ts) calls it, and the lines
// src/measure/startup-log.ts parses.
export const APP_STARTUP_LOG_CALL = "      writeStartupToDeviceLog(eventName);";
const APP_STARTUP_LOG_FORMAT = [
  /export const STARTUP_LOG_PREFIX = "\[startup\]";/,
  /`\$\{event\} \(x\$\{count\}\): \$\{time\} ms`/,
  /`App startup time: \$\{\w+\} ms, \$\{\w+\.length\} events`/,
];
// The refs before it get the app's lines: React Native's hook behind console.*, at the only level
// iOS release builds keep, and unlike console.error unseen by Datadog.
const STARTUP_LOG_LINES = [
  "      // startup-perf: the startup in the device log, as writeStartupToDeviceLog writes it",
  "      const startupPerfEvents = resolveStartupEvents();",
  "      const startupPerfTime = startupPerfEvents.find(e => e.event === eventName)?.time ?? 0;",
  "      type StartupPerfLog = { nativeLoggingHook?: (message: string, level: number) => void };",
  "      const startupPerfHook = (globalThis as StartupPerfLog).nativeLoggingHook;",
  "      for (const e of startupPerfEvents) {",
  "        startupPerfHook?.(`[startup] ${e.event} (x${e.count}): ${e.time} ms`, 3);",
  "      }",
  "      const startupPerfLast = `${startupPerfTime} ms, ${startupPerfEvents.length} events`;",
  "      startupPerfHook?.(`[startup] App startup time: ${startupPerfLast}`, 3);",
];
const TRUSTCHAIN_LENSE = "    lense: trustchainStoreSelector,";
const SAVE_AT_START = "    saveAtStart: true,";
const SWAP_API_BASE = 'SWAP_API_BASE="https://swap.ledger.com/v5"';
// Keys no store env file has.
const TEST_ONLY_KEY =
  /^(MOCK|DETOX|MOCK_COUNTERVALUES|DISABLE_YELLOW_BOX|FEATURE_FLAGS|SIMCTL_CHILD_\w*)=/;
const TEST_MODE_KEY = /^\s*(?:export\s+)?(?:MOCK|DETOX|MOCK_COUNTERVALUES)\s*=/;
// known-regression's build B: LIVE-36190, the only regression it re-adds.
const REGRESSIONS = new Set(["LIVE-36190"]);

const isE2eBuildWithDetox = (line: string) =>
  line.includes('"e2e:build":') && line.includes("DETOX=1 ");
const indexesOf = (lines: string[], matches: (index: number) => boolean): number[] =>
  lines.flatMap((_, index) => (matches(index) ? [index] : []));
const savesTrustchainAtStart = (lines: string[], index: number) =>
  index > 0 && lines[index - 1] === TRUSTCHAIN_LENSE && lines[index] === SAVE_AT_START;
const tracksStartupEnd = (lines: string[], index: number) =>
  index > 0 && lines[index - 1] === STARTUP_END_LINE && lines[index] === STARTUP_TRY_LINE;

/**
 * Starts the E2E bridge only on the launch that passes `wsPort` (the injection), `delayMs` after
 * the store is ready, so measured launches run no bridge code.
 */
export function gateBridgeOnWsPort(source: string, delayMs: number): string {
  const lines = linesOf(source);
  const imports = indexesOf(lines, i => lines[i] === BRIDGE_IMPORT);
  const blocks = indexesOf(lines, i =>
    DETOX_BRIDGE_BLOCK.every((line, k) => lines[i + k] === line),
  );
  const hasLaunchArguments = lines.includes(LAUNCH_ARGUMENTS_IMPORT);
  const otherLaunchArguments = countLines(
    lines,
    line => line !== LAUNCH_ARGUMENTS_IMPORT && line.includes('"react-native-launch-arguments"'),
  );
  if (imports.length !== 1 || blocks.length !== 1 || otherLaunchArguments !== 0) {
    throw new StepFailure(
      `cannot gate the bridge on wsPort: found ${imports.length} bridge import(s), ${blocks.length} onInitFinished DETOX block(s), ${otherLaunchArguments} other launch-arguments import(s); expected 1, 1, 0`,
    );
  }
  const gated = [
    DETOX_BRIDGE_BLOCK[0],
    "    if (Config.DETOX) {",
    "      init();",
    "    } else {",
    "      // startup-perf prod-like: the E2E bridge only on the injection launch (wsPort),",
    "      // after the measured startup, so measured launches run no bridge code.",
    "      setTimeout(() => {",
    '        if (LaunchArguments.value()["wsPort"]) init();',
    `      }, ${delayMs});`,
    "    }",
    "  };",
  ];
  const launchArguments = hasLaunchArguments ? [] : [LAUNCH_ARGUMENTS_IMPORT];
  return textOf(
    lines.flatMap((line, i) => {
      if (i === imports[0]) return [line, ...launchArguments];
      if (i === blocks[0]) return gated;
      return i > blocks[0] && i < blocks[0] + DETOX_BRIDGE_BLOCK.length ? [] : [line];
    }),
  );
}

/** rspack aliases the blur to the E2E mock for any "mock" ENVFILE: kept for DETOX=1 only. */
export const realBlur = (source: string): string =>
  textOf(linesOf(source).map(line => (line === RSPACK_LINE ? RSPACK_PROD_LINE : line)));

/** `e2e:build` without `DETOX=1`, which it sets from ef2aed228e8 on; null when it does not. */
export function bundleWithoutDetox(packageJson: string): string | null {
  const lines = linesOf(packageJson);
  if (countLines(lines, isE2eBuildWithDetox) === 0) return null;
  return textOf(
    lines.map(line => (isE2eBuildWithDetox(line) ? line.replace("DETOX=1 ", "") : line)),
  );
}

/** The env file without test-only keys and with swap on prod; `removed` lists key names only. */
export function prodLikeEnv(envFile: string): { text: string; removed: string[]; swap: boolean } {
  const removed: string[] = [];
  let swap = false;
  const lines = linesOf(envFile).flatMap(line => {
    if (TEST_ONLY_KEY.test(line)) {
      removed.push(line.slice(0, line.indexOf("=")));
      return [];
    }
    if (!line.startsWith("SWAP_API_BASE=")) return [line];
    swap = true;
    return [SWAP_API_BASE];
  });
  if (lines.some(line => TEST_MODE_KEY.test(line))) {
    throw new StepFailure("the env file still sets MOCK, DETOX or MOCK_COUNTERVALUES");
  }
  return { text: textOf(lines), removed, swap };
}

/** Logs a `JS start epoch <ms>` startup event: the wall clock of the JS start. */
export const logJsStartEpoch = (source: string): string =>
  textOf(
    linesOf(source).flatMap(line =>
      line === JS_START_LINE
        ? [
            'const startupPerfJsStart = logStartupEvent("Before js imports");',
            "logStartupEvent(`JS start epoch ${startupPerfJsStart.time}`); // startup-perf: JS start wall clock",
          ]
        : [line],
    ),
  );

/**
 * For the refs whose app does not log the startup itself: writes it to the device log as soon as it
 * is over, as `[startup]` lines (a startup event each, then the App startup time), on every launch,
 * first in the `try` as the app does. The harness reads it there instead of opening the
 * Debug screen.
 */
export function logStartupForMeasurement(source: string): string {
  const lines = linesOf(source);
  return textOf(
    lines.flatMap((line, i) =>
      tracksStartupEnd(lines, i) ? [line, ...STARTUP_LOG_LINES] : [line],
    ),
  );
}

/** Whether the app's own lines are the ones src/measure/startup-log.ts parses. */
export const logsStartupLikeHarness = (helper: string): boolean =>
  APP_STARTUP_LOG_FORMAT.every(format => format.test(helper));

/**
 * LIVE-36190: the trustchain is no longer saved at start, so its member keypair is generated again
 * at every launch (#21001 fixed it; its other half, a zod check of the keypair, no longer exists).
 */
export function readdLive36190(dbSave: string): string {
  const lines = linesOf(dbSave);
  return textOf(lines.filter((_, i) => !savesTrustchainAtStart(lines, i)));
}

interface AppFiles {
  env: string;
  index: string;
  rspack: string;
  packageJson: string;
  jsStart: string;
  lastStartupEvents: string;
  startupLog: string;
  dbSave: string;
}

const appFiles = (app: string): AppFiles => ({
  env: path.join(app, ".env.mock.prerelease"),
  index: path.join(app, "src/index.tsx"),
  rspack: path.join(app, "rspack.config.mjs"),
  packageJson: path.join(app, "package.json"),
  jsStart: path.join(app, "src/mvvm/utils/logStartup/beforeJSImports.ts"),
  lastStartupEvents: path.join(app, "src/mvvm/utils/logLastStartupEvents.ts"),
  startupLog: path.join(app, "src/mvvm/utils/writeStartupToDeviceLog.ts"),
  dbSave: path.join(app, "src/components/DBSave.ts"),
});

const read = (file: string) => readFileSync(file, "utf8");
const exactly = (file: string, line: string) => countLines(linesOf(read(file)), l => l === line);
const appLogsStartup = (files: AppFiles) =>
  exactly(files.lastStartupEvents, APP_STARTUP_LOG_CALL) > 0;

function requireOne(file: string, line: string, anchor: string): void {
  if (exactly(file, line) !== 1) throw new StepFailure(`${anchor} anchor missing in ${file}`);
}

/** Every anchor, before any file is edited. */
function checkApp(files: AppFiles, regression: string): void {
  const required = [files.env, files.index, files.rspack, files.packageJson, files.jsStart];
  for (const file of [...required, files.lastStartupEvents]) {
    if (!existsSync(file)) throw new StepFailure(`${file} not found`);
  }
  if (read(files.packageJson).includes('"react-native-startup-time"')) {
    throw new StepFailure(
      "refs before live-mobile@4.26.0 are not supported: this one still has react-native-startup-time",
    );
  }
  if (
    [files.index, files.rspack, files.jsStart, files.lastStartupEvents].some(file =>
      read(file).includes("startup-perf"),
    )
  ) {
    throw new StepFailure("this checkout is already patched");
  }
  requireOne(files.rspack, RSPACK_LINE, "isDetoxBuild");
  requireOne(files.index, BRIDGE_IMPORT, "bridge import");
  requireOne(files.jsStart, JS_START_LINE, "JS start");
  checkStartupLog(files);
  if (regression) checkLive36190(files.dbSave);
  for (const line of ["MOCK=1", "DETOX=1", "FORCE_DEBUG_VISIBLE=1"]) {
    if (exactly(files.env, line) !== 1) {
      throw new StepFailure(`expected one '${line}' line in ${files.env}`);
    }
  }
  if (countLines(linesOf(read(files.packageJson)), isE2eBuildWithDetox) > 1) {
    throw new StepFailure(`more than one e2e:build line sets DETOX=1 in ${files.packageJson}`);
  }
}

function checkStartupLog(files: AppFiles): void {
  if (!appLogsStartup(files)) {
    const lines = linesOf(read(files.lastStartupEvents));
    if (indexesOf(lines, i => tracksStartupEnd(lines, i)).length !== 1) {
      throw new StepFailure(`startup end anchor missing in ${files.lastStartupEvents}`);
    }
    return;
  }
  if (!existsSync(files.startupLog)) throw new StepFailure(`${files.startupLog} not found`);
  if (!logsStartupLikeHarness(read(files.startupLog))) {
    throw new StepFailure(
      `${files.startupLog} no longer writes the [startup] lines src/measure/startup-log.ts parses`,
    );
  }
}

function checkLive36190(dbSave: string): void {
  if (!existsSync(dbSave)) throw new StepFailure(`${dbSave} not found`);
  const lines = linesOf(read(dbSave));
  if (indexesOf(lines, i => savesTrustchainAtStart(lines, i)).length !== 1) {
    throw new StepFailure(
      `LIVE-36190 anchor missing in ${dbSave}: the trustchain save has no saveAtStart`,
    );
  }
}

// Names the file only: app files are not printed, as the env file holds API keys.
function rewrite(file: string, edit: (text: string) => string): void {
  writeFileSync(file, edit(read(file)));
  console.log(`edited ${path.relative(process.cwd(), file)}`);
}

function options(): { app: string; delayMs: number; regression: string } {
  const delay = process.env.STARTUP_PERF_BRIDGE_DELAY_MS || "20000";
  if (!/^\d+$/.test(delay)) {
    throw new StepFailure("STARTUP_PERF_BRIDGE_DELAY_MS must be a number of ms");
  }
  const regression = process.env.STARTUP_PERF_REGRESSION ?? "";
  if (regression && !REGRESSIONS.has(regression)) {
    throw new StepFailure(`unknown STARTUP_PERF_REGRESSION ${regression}`);
  }
  const app = insideWorkingDir(process.argv[2] || "apps/ledger-live-mobile");
  if (!existsSync(app) || !statSync(app).isDirectory()) {
    throw new StepFailure(`no app directory ${app}`);
  }
  return { app, delayMs: Number(delay), regression };
}

function main(): void {
  const { app, delayMs, regression } = options();
  const files = appFiles(app);
  checkApp(files, regression);

  rewrite(files.index, source => gateBridgeOnWsPort(source, delayMs));
  rewrite(files.rspack, realBlur);

  const withoutDetox = bundleWithoutDetox(read(files.packageJson));
  if (withoutDetox !== null) {
    rewrite(files.packageJson, () => withoutDetox);
    summary("e2e:build bundles without DETOX=1");
  }

  // Only key names are printed: the file also holds API keys.
  const env = prodLikeEnv(read(files.env));
  writeFileSync(files.env, env.text);
  env.removed.forEach(key => console.error(`  removed ${key}`));
  if (env.swap) console.error("  SWAP_API_BASE set to prod");

  rewrite(files.jsStart, logJsStartEpoch);
  summary('startup events include "JS start epoch <ms>"');

  if (appLogsStartup(files)) {
    summary('the app writes the startup to the device log itself ("[startup] ...")');
  } else {
    rewrite(files.lastStartupEvents, logStartupForMeasurement);
    summary('the startup is written to the device log ("[startup] ...") as soon as it is over');
  }

  if (regression) {
    rewrite(files.dbSave, readdLive36190);
    summary("LIVE-36190 re-added: the trustchain is no longer saved at start");
  }
  summary(
    `prod-like build: no MOCK/DETOX in the env file, swap on prod, bridge on wsPort only after ${delayMs} ms, real blur`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runStep("prepare-build", main);
}
