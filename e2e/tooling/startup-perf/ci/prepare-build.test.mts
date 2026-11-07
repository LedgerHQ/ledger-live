import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BRIDGE_IMPORT,
  bundleWithoutDetox,
  gateBridgeOnWsPort,
  JS_START_LINE,
  logJsStartEpoch,
  prodLikeEnv,
  readdLive36190,
  realBlur,
  RSPACK_LINE,
} from "./prepare-build.mts";
import { linesOf, textOf } from "./step.mts";

const INDEX = textOf([
  'import Config from "react-native-config";',
  BRIDGE_IMPORT,
  "",
  "class Root {",
  "  onInitFinished = () => {",
  "    if (Config.DETOX) {",
  "      init();",
  "    }",
  "  };",
  "}",
]);

describe("linesOf and textOf", () => {
  it("read lines as awk does and end every line with a newline", () => {
    assert.deepEqual(linesOf("a\nb\n"), ["a", "b"]);
    assert.deepEqual(linesOf("a\nb"), ["a", "b"]);
    assert.deepEqual(linesOf(""), []);
    assert.equal(textOf(linesOf("a\nb")), "a\nb\n");
  });
});

describe("gateBridgeOnWsPort", () => {
  it("starts the bridge only on a launch with wsPort, after the delay", () => {
    const lines = linesOf(gateBridgeOnWsPort(INDEX, 20000));
    assert.equal(lines[2], 'import { LaunchArguments } from "react-native-launch-arguments";');
    assert.deepEqual(lines.slice(5, 16), [
      "  onInitFinished = () => {",
      "    if (Config.DETOX) {",
      "      init();",
      "    } else {",
      "      // startup-perf prod-like: the E2E bridge only on the injection launch (wsPort),",
      "      // after the measured startup, so measured launches run no bridge code.",
      "      setTimeout(() => {",
      '        if (LaunchArguments.value()["wsPort"]) init();',
      "      }, 20000);",
      "    }",
      "  };",
    ]);
    assert.equal(lines.at(-1), "}");
  });

  it("does not import LaunchArguments twice", () => {
    const source = INDEX.replace(
      BRIDGE_IMPORT,
      `${BRIDGE_IMPORT}\nimport { LaunchArguments } from "react-native-launch-arguments";`,
    );
    const lines = linesOf(gateBridgeOnWsPort(source, 20000));
    assert.equal(lines.filter(line => line.includes("react-native-launch-arguments")).length, 1);
  });

  it("fails when the DETOX block changed", () => {
    assert.throws(
      () => gateBridgeOnWsPort(INDEX.replace("      init();", "      init(true);"), 20000),
      /found 1 bridge import\(s\), 0 onInitFinished DETOX block\(s\)/,
    );
  });
});

describe("realBlur", () => {
  it("keeps the blur mock for DETOX=1 only", () => {
    assert.equal(
      realBlur(`${RSPACK_LINE}\n`),
      'const isDetoxBuild = process.env.DETOX === "1"; // startup-perf prod-like: no blur mock\n',
    );
  });
});

describe("bundleWithoutDetox", () => {
  it("drops DETOX=1 from e2e:build", () => {
    const packageJson = '  "e2e:build": "DETOX=1 zx ./scripts/e2e-build.mjs",\n';
    assert.equal(bundleWithoutDetox(packageJson), '  "e2e:build": "zx ./scripts/e2e-build.mjs",\n');
  });
  it("leaves a package.json without it untouched", () => {
    assert.equal(bundleWithoutDetox('  "e2e:build": "zx ./scripts/e2e-build.mjs",\n'), null);
  });
});

describe("prodLikeEnv", () => {
  const env = textOf([
    "MOCK=1",
    "DETOX=1",
    "FORCE_DEBUG_VISIBLE=1",
    "SIMCTL_CHILD_FOO=bar",
    'SWAP_API_BASE="https://swap-stg.ledger-test.com/v5"',
    "API_KEY=secret",
  ]);

  it("removes the test-only keys, points swap to prod and names only the keys", () => {
    const result = prodLikeEnv(env);
    assert.equal(
      result.text,
      textOf([
        "FORCE_DEBUG_VISIBLE=1",
        'SWAP_API_BASE="https://swap.ledger.com/v5"',
        "API_KEY=secret",
      ]),
    );
    assert.deepEqual(result.removed, ["MOCK", "DETOX", "SIMCTL_CHILD_FOO"]);
    assert.equal(result.swap, true);
  });

  it("fails when a test mode is still set another way", () => {
    assert.throws(() => prodLikeEnv("export MOCK = 1\n"), /still sets MOCK, DETOX/);
  });
});

describe("logJsStartEpoch", () => {
  it("logs the wall clock of the JS start", () => {
    assert.deepEqual(linesOf(logJsStartEpoch(`${JS_START_LINE}\n`)), [
      'const startupPerfJsStart = logStartupEvent("Before js imports");',
      "logStartupEvent(`JS start epoch ${startupPerfJsStart.time}`); // startup-perf: JS start wall clock",
    ]);
  });
});

describe("readdLive36190", () => {
  it("stops saving the trustchain at start, and only the trustchain", () => {
    const dbSave = textOf([
      "    lense: trustchainStoreSelector,",
      "    saveAtStart: true,",
      "    lense: walletStoreSelector,",
      "    saveAtStart: true,",
    ]);
    assert.deepEqual(linesOf(readdLive36190(dbSave)), [
      "    lense: trustchainStoreSelector,",
      "    lense: walletStoreSelector,",
      "    saveAtStart: true,",
    ]);
  });
});
