import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { startsBridgeOnlyWithDetox } from "../ci/prepare-build.mts";
import { isPrepared } from "../ci/verify-build.mts";
import {
  ACCOUNT_KEY_PREFIX,
  ACCOUNT_ORDER_KEY,
  GENERAL_TERMS_VERSION,
  IDENTITIES_KEY,
  MIGRATION_DONE,
  STORAGE_FILE,
} from "./measure/storage.ts";
import { parseStartupLog, STARTUP_LOG_MARKER } from "./measure/startup-log.ts";

// What the measurement needs from the mobile app of this checkout: a failure means an app change
// broke it (README.md, "The build" and "A launch").
const APP = path.join(import.meta.dirname, "../../../../apps/ledger-live-mobile");
const PREPARED_FILES = [
  ".env.mock.prerelease",
  "src/index.tsx",
  "package.json",
  "rspack.config.mjs",
  "src/mvvm/utils/logStartup/beforeJSImports.ts",
  "src/mvvm/utils/logLastStartupEvents.ts",
  "src/components/DBSave.ts",
];
const TRUSTCHAIN_SAVED_AT_START = /lense: trustchainStoreSelector,\n\s*saveAtStart: true,/;

const read = (root: string, file: string) => readFileSync(path.join(root, file), "utf8");
const assertIncludes = (source: string, line: string) =>
  assert.ok(source.includes(line), `the app's source no longer contains: ${line}`);
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

  it("writes the startup lines as startup-log.ts reads them, the only way the launches are read", () => {
    const writer = read(APP, "src/mvvm/utils/writeStartupToDeviceLog.ts");
    assert.ok(writer.includes(`STARTUP_LOG_PREFIX = "${STARTUP_LOG_MARKER.trim()}"`));
    // The error level, the only one iOS release builds keep in the device log.
    assert.ok(writer.includes("const NATIVE_ERROR_LEVEL = 3;"), "the lines' log level changed");
    assert.ok(
      writer.includes("nativeLoggingHook(`${STARTUP_LOG_PREFIX} ${line}`, NATIVE_ERROR_LEVEL)"),
      "the lines are no longer written at NATIVE_ERROR_LEVEL",
    );
    const eventLine = "`${event} (x${count}): ${time} ms`";
    const lastLine = "`App startup time: ${appStartupTime} ms, ${events.length} events`";
    assert.ok(writer.includes(eventLine), "the event line changed: check startup-log.ts");
    assert.ok(writer.includes(lastLine), "the App startup time line changed: check startup-log.ts");
    // Lines filled in as those two templates fill them.
    const events = [
      { event: "Before js imports", count: 1, time: 410 },
      { event: "App started", count: 2, time: 1650 },
    ];
    const lines = [
      ...events.map(({ event, count, time }) => `${event} (x${count}): ${time} ms`),
      `App startup time: 1650 ms, ${events.length} events`,
    ];
    assert.deepEqual(parseStartupLog(lines.map(line => STARTUP_LOG_MARKER + line).join("\n")), {
      appStartupTime: 1650,
      events: {
        "Before js imports": { count: 1, time: 410 },
        "App started": { count: 2, time: 1650 },
      },
    });
  });

  it("takes every edit of prepare-build.mts, and verify-build.mts sees it prepared", () => {
    prepare({}, app => {
      assert.ok(isPrepared(app), "verify-build.mts would reject the prepared checkout");
      assert.doesNotMatch(read(app, "package.json"), /"e2e:build": "[^"]*DETOX=1/);
      assert.match(read(app, "rspack.config.mjs"), /startup-perf prod-like: no blur mock/);
      assert.doesNotMatch(read(app, ".env.mock.prerelease"), /^(MOCK|DETOX|FORCE_DEBUG_VISIBLE)=/m);
      assert.match(read(app, "src/components/DBSave.ts"), TRUSTCHAIN_SAVED_AT_START);
    });
  });

  it("can have LIVE-36190 re-added for known-regression's build B", () => {
    prepare({ STARTUP_PERF_REGRESSION: "LIVE-36190" }, app => {
      assert.doesNotMatch(read(app, "src/components/DBSave.ts"), TRUSTCHAIN_SAVED_AT_START);
    });
  });

  it("starts the E2E bridge only with DETOX, which the prepared env file no longer sets", () => {
    assert.ok(startsBridgeOnlyWithDetox(read(APP, "src/index.tsx")));
  });

  it("saves its client ids at every start, which inject.ts takes as the sign it read the storage", () => {
    assert.match(
      read(APP, "src/components/DBSave.ts"),
      /stateSelector: \(state: State\) => state\.identities,\n(\s*\w+: [^\n]*\n)*?\s*saveAtStart: true,/,
    );
    assertIncludes(read(APP, "src/db.ts"), `storage.save("${IDENTITIES_KEY}"`);
  });

  it("reads the keys storage.ts writes before the first launch", () => {
    const storageIds = read(APP, "src/mvvm/storage/mmkvStorageWrapper/constants.ts");
    assertIncludes(storageIds, `ID: "${STORAGE_FILE}"`);
    const migration = read(APP, "src/mvvm/storage/utils/migrations/constants.ts");
    assertIncludes(migration, `MIGRATION_STATUS_KEY = "${MIGRATION_DONE[0]}"`);
    assertIncludes(migration, `COMPLETED: "${MIGRATION_DONE[1]}"`);
    const db = read(APP, "src/db.ts");
    assertIncludes(db, `ACCOUNTS_KEY_SORT = "${ACCOUNT_ORDER_KEY}"`);
    assertIncludes(db, `ACCOUNTS_DB_PREFIX = "${ACCOUNT_KEY_PREFIX}"`);
    for (const key of ["settings", "postOnboarding"]) assertIncludes(db, `storage.get("${key}")`);
    const terms = read(APP, "src/logic/terms.tsx");
    assertIncludes(terms, `generalTermsVersionRequired = "${GENERAL_TERMS_VERSION}"`);
  });
});
