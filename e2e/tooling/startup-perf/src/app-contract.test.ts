import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

// What the measurement needs from the mobile app of this checkout: a failure means an app change
// broke it (README.md, "The build" and "A launch").
const APP = path.join(import.meta.dirname, "../../../../apps/ledger-live-mobile");
const PREPARED_FILES = [
  ".env.mock.prerelease",
  "package.json",
  "rspack.config.mjs",
  "src/index.tsx",
  "src/mvvm/utils/logStartup/beforeJSImports.ts",
  "src/components/DBSave.ts",
];
const TRUSTCHAIN_SAVED_AT_START = /lense: trustchainStoreSelector,\n\s*saveAtStart: true,/;

const read = (root: string, file: string) => readFileSync(path.join(root, file), "utf8");
const stderrOf = (error: unknown) =>
  error instanceof Error && "stderr" in error ? String(error.stderr) : String(error);

/** Runs prepare-build.mts on a copy of the app files it edits, then hands the copy to `check`. */
function prepare(env: Record<string, string>, check: (app: string) => void): void {
  const dir = mkdtempSync(path.join(tmpdir(), "startup-perf-"));
  const app = path.join(dir, "app");
  try {
    for (const file of PREPARED_FILES) {
      mkdirSync(path.dirname(path.join(app, file)), { recursive: true });
      copyFileSync(path.join(APP, file), path.join(app, file));
    }
    try {
      execFileSync(
        process.execPath,
        [path.join(import.meta.dirname, "../ci/prepare-build.mts"), "app"],
        {
          cwd: dir,
          stdio: "pipe",
          env: { ...process.env, GITHUB_STEP_SUMMARY: "", ...env },
        },
      );
    } catch (error) {
      assert.fail(`prepare-build.mts no longer applies:\n${stderrOf(error)}`);
    }
    check(app);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("the mobile app of this checkout", () => {
  it("writes the startup lines only once both final events are logged", () => {
    const source = read(APP, "src/mvvm/utils/logLastStartupEvents.ts");
    assert.match(
      source,
      /LAST_STARTUP_EVENT_VALUES = \[STARTUP_EVENTS\.APP_STARTED, STARTUP_EVENTS\.NAV_READY\]/,
    );
    const gate = source.search(/otherStartupEvents\.every\(\(?e\)? => alreadyLogged\.has\(e\)\)/);
    const writes = [...source.matchAll(/writeStartupToDeviceLog\(eventName\)/g)];
    assert.ok(gate >= 0, "the gate on both final events moved: check startup-log.ts still holds");
    assert.equal(writes.length, 1);
    assert.ok(
      (writes[0].index ?? -1) > gate,
      "the startup lines are written before both final events",
    );
  });

  it("takes every edit of prepare-build.mts", () => {
    prepare({}, app => {
      assert.doesNotMatch(read(app, "package.json"), /"e2e:build": "[^"]*DETOX=1/);
      assert.match(read(app, "rspack.config.mjs"), /startup-perf prod-like: no blur mock/);
      assert.match(read(app, "src/index.tsx"), /LaunchArguments\.value\(\)\["wsPort"\]/);
      assert.doesNotMatch(read(app, ".env.mock.prerelease"), /^(MOCK|DETOX)=/m);
      assert.match(read(app, "src/mvvm/utils/logStartup/beforeJSImports.ts"), /JS start epoch/);
      assert.match(read(app, "src/components/DBSave.ts"), TRUSTCHAIN_SAVED_AT_START);
    });
  });

  it("can have LIVE-36190 re-added for known-regression's build B", () => {
    prepare({ STARTUP_PERF_REGRESSION: "LIVE-36190" }, app => {
      assert.doesNotMatch(read(app, "src/components/DBSave.ts"), TRUSTCHAIN_SAVED_AT_START);
    });
  });

  it("handles every bridge message the injection sends", () => {
    const client = read(APP, "src/e2e/bridge/client.ts");
    const sent = new Set(
      [...read(import.meta.dirname, "measure/inject.ts").matchAll(/send\("(\w+)"/g)].map(m => m[1]),
    );
    assert.ok(sent.has("getEnvs") && sent.has("importSettings"), "inject.ts was not parsed");
    for (const type of sent) {
      assert.match(client, new RegExp(`case "${type}"`), `client.ts no longer handles ${type}`);
    }
    assert.match(client, /type: "appEnvs"/);
  });

  it("shows the screens and labels the Maestro flows and the parser look for", () => {
    const english = JSON.parse(read(APP, "src/locales/en/common.json"));
    assert.match(english.settings.debug.title, /^Debug/);
    assert.match(read(APP, "src/screens/Settings/Debug/index.tsx"), /title="Performance"/);
    assert.match(
      read(APP, "src/screens/Settings/Debug/Performance/index.tsx"),
      /title="App startup time"/,
    );
  });
});
