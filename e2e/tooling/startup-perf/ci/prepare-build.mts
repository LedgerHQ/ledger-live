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
export const JS_START_LINE = 'logStartupEvent("Before js imports");';
const TRUSTCHAIN_LENSE = "    lense: trustchainStoreSelector,";
const SAVE_AT_START = "    saveAtStart: true,";
const SWAP_API_BASE = 'SWAP_API_BASE="https://swap.ledger.com/v5"';
// Keys no store env file has.
// FORCE_DEBUG_VISIBLE only shows Settings > Debug: the startup is read from the device log.
const TEST_ONLY_KEY =
  /^(MOCK|DETOX|MOCK_COUNTERVALUES|DISABLE_YELLOW_BOX|FEATURE_FLAGS|FORCE_DEBUG_VISIBLE|SIMCTL_CHILD_\w*)=/;
const TEST_MODE_KEY = /^\s*(?:export\s+)?(?:MOCK|DETOX|MOCK_COUNTERVALUES)\s*=/;
// known-regression's build B: LIVE-36190, the only regression it re-adds.
const REGRESSIONS = new Set(["LIVE-36190"]);

const isE2eBuildWithDetox = (line: string) =>
  line.includes('"e2e:build":') && line.includes("DETOX=1 ");
const indexesOf = (lines: string[], matches: (index: number) => boolean): number[] =>
  lines.flatMap((_, index) => (matches(index) ? [index] : []));
const savesTrustchainAtStart = (lines: string[], index: number) =>
  index > 0 && lines[index - 1] === TRUSTCHAIN_LENSE && lines[index] === SAVE_AT_START;

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
 * LIVE-36190: the trustchain is no longer saved at start, so its member keypair is generated again
 * at every launch (#21001 fixed it; its other half, a zod check of the keypair, no longer exists).
 */
export function readdLive36190(dbSave: string): string {
  const lines = linesOf(dbSave);
  return textOf(lines.filter((_, i) => !savesTrustchainAtStart(lines, i)));
}

export const BRIDGE_IMPORT = 'import { init } from "~/e2e/bridge/client";';
// The E2E bridge's only start: the prod-like env file has no DETOX, so measured launches run none
// of it. Each measured ref is checked, as the checkout's app-contract test covers only its own.
export const DETOX_BRIDGE_BLOCK = [
  "  onInitFinished = () => {",
  "    if (Config.DETOX) {",
  "      init();",
  "    }",
  "  };",
];
// A bare init() call: not Sentry.init() or another object's.
const callsBridgeInit = (line: string) => /(^|[^.\w])init\(\)/.test(line);

/** Whether the app starts the E2E bridge only in onInitFinished, and only with DETOX. */
export function startsBridgeOnlyWithDetox(index: string): boolean {
  const lines = linesOf(index);
  const blocks = indexesOf(lines, i =>
    DETOX_BRIDGE_BLOCK.every((line, k) => lines[i + k] === line),
  );
  return (
    countLines(lines, line => line === BRIDGE_IMPORT) === 1 &&
    blocks.length === 1 &&
    countLines(lines, callsBridgeInit) === 1
  );
}

interface AppFiles {
  env: string;
  index: string;
  rspack: string;
  packageJson: string;
  jsStart: string;
  /** Writes the startup to the device log (#24576, live-mobile@4.29.0 on), where run.ts reads it. */
  startupLog: string;
  dbSave: string;
}

const appFiles = (app: string): AppFiles => ({
  env: path.join(app, ".env.mock.prerelease"),
  index: path.join(app, "src/index.tsx"),
  rspack: path.join(app, "rspack.config.mjs"),
  packageJson: path.join(app, "package.json"),
  jsStart: path.join(app, "src/mvvm/utils/logStartup/beforeJSImports.ts"),
  startupLog: path.join(app, "src/mvvm/utils/logLastStartupEvents.ts"),
  dbSave: path.join(app, "src/components/DBSave.ts"),
});

const read = (file: string) => readFileSync(file, "utf8");
const exactly = (file: string, line: string) => countLines(linesOf(read(file)), l => l === line);

function requireOne(file: string, line: string, anchor: string): void {
  if (exactly(file, line) !== 1) throw new StepFailure(`${anchor} anchor missing in ${file}`);
}

/** Every anchor, before any file is edited. */
function checkApp(files: AppFiles, regression: string): void {
  for (const file of [files.env, files.index, files.rspack, files.packageJson, files.jsStart]) {
    if (!existsSync(file)) throw new StepFailure(`${file} not found`);
  }
  if (read(files.packageJson).includes('"react-native-startup-time"')) {
    throw new StepFailure(
      "refs before live-mobile@4.26.0 are not supported: this one still has react-native-startup-time",
    );
  }
  if (
    !existsSync(files.startupLog) ||
    !read(files.startupLog).includes("writeStartupToDeviceLog(")
  ) {
    throw new StepFailure(
      "refs before live-mobile@4.29.0 are not supported: this one does not write its startup to the device log (#24576), where it is read",
    );
  }
  if ([files.rspack, files.jsStart].some(file => read(file).includes("startup-perf"))) {
    throw new StepFailure("this checkout is already patched");
  }
  requireOne(files.rspack, RSPACK_LINE, "isDetoxBuild");
  requireOne(files.jsStart, JS_START_LINE, "JS start");
  if (!startsBridgeOnlyWithDetox(read(files.index))) {
    throw new StepFailure(
      `${files.index} must start the E2E bridge (init()) only in onInitFinished's Config.DETOX block, or measured launches may run it`,
    );
  }
  if (regression) checkLive36190(files.dbSave);
  for (const line of ["MOCK=1", "DETOX=1"]) {
    if (exactly(files.env, line) !== 1) {
      throw new StepFailure(`expected one '${line}' line in ${files.env}`);
    }
  }
  if (countLines(linesOf(read(files.packageJson)), isE2eBuildWithDetox) > 1) {
    throw new StepFailure(`more than one e2e:build line sets DETOX=1 in ${files.packageJson}`);
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

function options(): { app: string; regression: string } {
  const regression = process.env.STARTUP_PERF_REGRESSION ?? "";
  if (regression && !REGRESSIONS.has(regression)) {
    throw new StepFailure(`unknown STARTUP_PERF_REGRESSION ${regression}`);
  }
  const app = insideWorkingDir(process.argv[2] || "apps/ledger-live-mobile");
  if (!existsSync(app) || !statSync(app).isDirectory()) {
    throw new StepFailure(`no app directory ${app}`);
  }
  return { app, regression };
}

function main(): void {
  const { app, regression } = options();
  const files = appFiles(app);
  checkApp(files, regression);

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

  if (regression) {
    rewrite(files.dbSave, readdLive36190);
    summary("LIVE-36190 re-added: the trustchain is no longer saved at start");
  }
  summary(
    "prod-like build: no MOCK/DETOX (so no E2E bridge) or FORCE_DEBUG_VISIBLE in the env file, swap on prod, real blur",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runStep("prepare-build", main);
}
