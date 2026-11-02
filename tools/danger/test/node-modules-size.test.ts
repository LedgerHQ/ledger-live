import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeLockfiles, isDedupable } from "../node-modules-size.ts";
import { lockfile } from "./fixtures.ts";

const MB = 1e6;
const base = lockfile(
  { app: "1.0.0", lib: "1.0.0" },
  {
    "app@1.0.0": { shared: "1.0.0", tiny: "1.0.0" },
    "lib@1.0.0": {},
    "shared@1.0.0": {},
    "tiny@1.0.0": {},
  },
);

function analyze(head: string, sizes: Record<string, number> = {}) {
  return analyzeLockfiles({
    base,
    head,
    baseWorkspace: null,
    headWorkspace: null,
    changedFiles: ["pnpm-lock.yaml", "package.json"],
    host: { os: "linux", cpu: "x64" },
    lookupSizes: async keys => new Map(keys.map(k => [k, sizes[k] ?? 0])),
  });
}

describe("new duplicate versions", () => {
  it("flags a compatible extra copy with its chain", async () => {
    const head = lockfile(
      { app: "1.0.0", lib: "1.1.0" },
      {
        "app@1.0.0": { shared: "1.0.0", tiny: "1.0.0" },
        "lib@1.1.0": { shared: "1.4.0" },
        "shared@1.0.0": {},
        "shared@1.4.0": {},
        "tiny@1.0.0": {},
      },
    );
    const report = await analyze(head, { "shared@1.4.0": 3 * MB });

    assert.deepEqual(report.duplicates, [
      {
        name: "shared",
        deltaBytes: 3 * MB,
        added: [{ version: "1.4.0", compatibleWith: ["1.0.0"], chain: ". > lib > shared" }],
        existing: ["1.0.0"],
      },
    ]);
    assert.ok(isDedupable(report.duplicates[0]));
    assert.match(
      report.duplicatesMarkdown,
      /\| `shared` \| \+3\.0 MB \| 1\.4\.0 ♻️ \^1\.0\.0 \| 1\.0\.0 \| `\. > lib > shared` \|/,
    );
  });

  it("lists a new major for information only", async () => {
    const head = lockfile(
      { app: "1.0.0", lib: "1.0.0" },
      {
        "app@1.0.0": { shared: "1.0.0", tiny: "1.0.0" },
        "lib@1.0.0": { shared: "2.0.0" },
        "shared@1.0.0": {},
        "shared@2.0.0": {},
        "tiny@1.0.0": {},
      },
    );
    const [duplicate] = (await analyze(head, { "shared@2.0.0": 2 * MB })).duplicates;

    assert.deepEqual(duplicate.added, [
      { version: "2.0.0", compatibleWith: [], chain: ". > lib > shared" },
    ]);
    assert.equal(isDedupable(duplicate), false);
  });

  it("applies caret ranges below 1.0.0", async () => {
    const head = lockfile(
      { app: "1.0.0", lib: "1.0.0" },
      {
        "app@1.0.0": { shared: "1.0.0", tiny: "1.0.0" },
        "lib@1.0.0": { tiny: "0.2.0" },
        "shared@1.0.0": {},
        "tiny@1.0.0": {},
        "tiny@0.2.0": {},
      },
    );
    const zeroMinor = lockfile(
      { app: "1.0.0", lib: "1.0.0" },
      {
        "app@1.0.0": { shared: "1.0.0", tiny: "0.2.5" },
        "lib@1.0.0": { tiny: "0.2.1" },
        "shared@1.0.0": {},
        "tiny@0.2.1": {},
        "tiny@0.2.5": {},
      },
    );
    const sizes = { "tiny@0.2.0": 2 * MB, "tiny@0.2.1": 2 * MB, "tiny@0.2.5": 2 * MB };

    assert.deepEqual((await analyze(head, sizes)).duplicates[0].added[0].compatibleWith, []);
    // base had tiny@1.0.0 only, so both 0.2.x are new and only match each other
    const zeroMinorReport = await analyze(zeroMinor, sizes);
    assert.deepEqual(
      zeroMinorReport.duplicates[0].added.map(a => a.compatibleWith),
      [["0.2.5"], ["0.2.1"]],
    );
    assert.match(zeroMinorReport.duplicatesMarkdown, /\| 0\.2\.1 ♻️ \^0\.2\.1 \|/);
    assert.match(zeroMinorReport.duplicatesMarkdown, /\| 0\.2\.5 ♻️ \^0\.2\.1 \|/);
  });

  it("anchors the shared range at the lower version when the new one is older", async () => {
    const head = lockfile(
      { app: "1.0.0", lib: "1.0.0" },
      {
        "app@1.0.0": { shared: "1.4.0", tiny: "1.0.0" },
        "lib@1.0.0": { shared: "1.0.0" },
        "shared@1.0.0": {},
        "shared@1.4.0": {},
        "tiny@1.0.0": {},
      },
    );
    const base14 = lockfile(
      { app: "1.0.0", lib: "1.0.0" },
      { "app@1.0.0": { shared: "1.4.0" }, "lib@1.0.0": {}, "shared@1.4.0": {} },
    );
    const report = await analyzeLockfiles({
      base: base14,
      head,
      baseWorkspace: null,
      headWorkspace: null,
      changedFiles: ["pnpm-lock.yaml"],
      host: { os: "linux", cpu: "x64" },
      lookupSizes: async keys => new Map(keys.map(k => [k, k === "shared@1.0.0" ? 2 * MB : 0])),
    });

    assert.deepEqual(report.duplicates[0].added[0].compatibleWith, ["1.4.0"]);
    assert.match(
      report.duplicatesMarkdown,
      /\| `shared` \| \+2\.0 MB \| 1\.0\.0 ♻️ \^1\.0\.0 \| 1\.4\.0 \| `\. > lib > shared` \|/,
    );
  });

  it("keeps prereleases informational", async () => {
    const withShared = (version: string) =>
      lockfile(
        { app: "1.0.0", lib: "1.0.0" },
        {
          "app@1.0.0": { shared: "1.0.0", tiny: "1.0.0" },
          "lib@1.0.0": { shared: version },
          "shared@1.0.0": {},
          [`shared@${version}`]: {},
          "tiny@1.0.0": {},
        },
      );
    const betaBase = lockfile(
      { app: "1.0.0", lib: "1.0.0" },
      { "app@1.0.0": { shared: "1.1.0-beta.1" }, "lib@1.0.0": {}, "shared@1.1.0-beta.1": {} },
    );
    const betaHead = lockfile(
      { app: "1.0.0", lib: "1.0.0" },
      {
        "app@1.0.0": { shared: "1.1.0-beta.1" },
        "lib@1.0.0": { shared: "1.1.0-beta.2" },
        "shared@1.1.0-beta.1": {},
        "shared@1.1.0-beta.2": {},
      },
    );
    const sizes = { "shared@1.1.0-beta.1": 2 * MB, "shared@1.1.0-beta.2": 2 * MB };

    const [stableThenBeta] = (await analyze(withShared("1.1.0-beta.1"), sizes)).duplicates;
    assert.deepEqual(stableThenBeta.added[0].compatibleWith, []);
    assert.equal(isDedupable(stableThenBeta), false);

    const betas = await analyzeLockfiles({
      base: betaBase,
      head: betaHead,
      baseWorkspace: null,
      headWorkspace: null,
      changedFiles: ["pnpm-lock.yaml"],
      host: { os: "linux", cpu: "x64" },
      lookupSizes: async keys => new Map(keys.map(k => [k, sizes[k as keyof typeof sizes] ?? 0])),
    });
    assert.deepEqual(betas.duplicates[0].added[0].compatibleWith, []);
    assert.doesNotMatch(betas.duplicatesMarkdown, /♻️/);
  });

  it("ignores copies under the size floor", async () => {
    const head = lockfile(
      { app: "1.0.0", lib: "1.0.0" },
      {
        "app@1.0.0": { shared: "1.0.0", tiny: "1.0.0" },
        "lib@1.0.0": { tiny: "1.1.0" },
        "shared@1.0.0": {},
        "tiny@1.0.0": {},
        "tiny@1.1.0": {},
      },
    );
    const report = await analyze(head, { "tiny@1.1.0": 0.5 * MB });

    assert.deepEqual(report.duplicates, []);
    assert.equal(report.duplicatesMarkdown, "");
  });

  it("ignores upgrades, new packages and peer variants", async () => {
    const head = lockfile(
      { app: "1.0.0", lib: "1.0.0", fresh: "1.0.0" },
      {
        "app@1.0.0": { shared: "1.1.0(tiny@1.0.0)", tiny: "1.0.0" },
        "lib@1.0.0": { shared: "1.1.0(tiny@2.0.0)", tiny: "2.0.0" },
        "fresh@1.0.0": {},
        "shared@1.1.0(tiny@1.0.0)": {},
        "shared@1.1.0(tiny@2.0.0)": {},
        "tiny@1.0.0": {},
        "tiny@2.0.0": {},
      },
    );
    const report = await analyze(head, {
      "fresh@1.0.0": 5 * MB,
      "shared@1.1.0": 5 * MB,
      "tiny@2.0.0": 5 * MB,
    });

    assert.deepEqual(
      report.duplicates.map(d => d.name),
      ["tiny"],
    );
  });
});
