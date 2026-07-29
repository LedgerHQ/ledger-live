/* eslint-disable no-console */
// Unit tests for the mobile E2E spec selector.
// Run directly (not picked up by jest):
//   node --test e2e/tooling/filter/selectSpecs.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { filterTestFiles, findTestFiles } from "./selectSpecs.mjs";

// --- Fixture tree that mimics real mobile specs -----------------------------
// Each entry: relative path -> file content. The content deliberately exercises
// every way "swap" can appear (folder, filename, tag, describe/it title,
// page-object method name, and a comment) so we can prove the selector only
// keys off the PATH and DECLARED TAGS.
const FIXTURES = {
  // Real swap flow: lives under swap/ AND filename starts with swap -> PATH match.
  "swap/swapETH_BTC.spec.ts": `
    import { runSwapTest } from "./swap";
    runSwapTest(Account.ETH_1, Account.BTC_1, ["B2CQA-2750"], [
      "@NanoSP", "@ethereum", "@family-evm", "@bitcoin", "@family-bitcoin",
    ]);
  `,
  "swap/otherTestCases/swap_noAccountTo.spec.ts": `
    import { runSwapWithoutAccountTest } from "./swap.other";
    runSwapWithoutAccountTest(Account.ETH_1, ["B2CQA-1"], ["@NanoSP", "@ethereum"]);
  `,
  // A swap-tagged spec that does NOT live in the swap folder -> TAG match.
  "settings/swapEntryFromSettings.spec.ts": `
    describe("Settings entry", () => {
      $Tag("@swapSmoke");
      $Tag("@NanoSP");
      it("opens swap from settings", async () => {});
    });
  `,
  // Wallet XP (Wallet 4.0) spec: "swap" only appears in a page-object method
  // name and an it() title. It has NO swap tag and is NOT in a swap path.
  "wallet40Q2/portfolio.spec.ts": `
    setTeamOwner(Team.WALLET_XP);
    describe("Wallet 4.0 Q2 - Portfolio", () => {
      $Tag("@NanoSP"); $Tag("@Flex");
      it("navigates to the swap screen", async () => {
        await app.portfolio.pressQuickActionSwapButton();
      });
    });
  `,
  // Wallet XP spec whose ONLY "swap" occurrence is in a comment (the original bug).
  "wallet40Q2/assetDiscoverability.spec.ts": `
    // whole suite (same approach as the swap specs).
    describe("Wallet 4.0 Q2 - Asset discoverability", () => {
      const TAGS = ["@NanoSP", "@Stax"];
      TAGS.forEach(tag => $Tag(tag));
      it("shows stocks", async () => {});
    });
  `,
  // A smoke-tagged settings spec (tags: [...] array form).
  "settings/passwordUnlock.spec.ts": `
    export const config = { tags: ["@NanoSP", "@LNS", "@smoke"] };
    describe("Password unlock", () => { it("unlocks", async () => {}); });
  `,
  // Duplicate basename in two folders (like sendATOM.spec.ts in the repo).
  "cosmos/sendATOM.spec.ts": `describe("send", () => { $Tag("@cosmos"); it("a", async () => {}); });`,
  "family/sendATOM.spec.ts": `describe("send", () => { $Tag("@family-cosmos"); it("a", async () => {}); });`,
  // A .skip.spec.ts must never be picked up by findTestFiles.
  "swap/otherTestCases/swapDisabled.skip.spec.ts": `$Tag("@swapSmoke");`,
};

let root;
let allFiles;

test.before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "shard-tests-"));
  for (const [rel, content] of Object.entries(FIXTURES)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  allFiles = findTestFiles(root);
});

test.after(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

// Helper: run the filter and return matched paths relative to the temp root.
const select = filter =>
  filterTestFiles(allFiles, filter)
    .map(f => path.relative(root, f))
    .sort();

test("findTestFiles ignores *.skip.spec.ts", () => {
  const rels = allFiles.map(f => path.relative(root, f));
  assert.ok(!rels.some(f => f.endsWith(".skip.spec.ts")), "skip specs must be excluded");
  assert.equal(allFiles.length, Object.keys(FIXTURES).length - 1);
});

test("empty filter returns all files", () => {
  assert.equal(select("").length, allFiles.length);
  assert.equal(select(undefined).length, allFiles.length);
});

test('filter "swap" selects swap-folder specs by PATH', () => {
  const selected = select("swap");
  assert.ok(selected.includes("swap/swapETH_BTC.spec.ts"));
  assert.ok(selected.includes("swap/otherTestCases/swap_noAccountTo.spec.ts"));
});

test('filter "swap" selects a swap-tagged spec OUTSIDE the swap folder (@swapSmoke)', () => {
  assert.ok(select("swap").includes("settings/swapEntryFromSettings.spec.ts"));
});

test('filter "swap" does NOT select Wallet XP spec (swap only in method name + it title)', () => {
  assert.ok(!select("swap").includes("wallet40Q2/portfolio.spec.ts"));
});

test('filter "swap" does NOT select the comment-only Wallet XP spec (the original bug)', () => {
  assert.ok(!select("swap").includes("wallet40Q2/assetDiscoverability.spec.ts"));
});

test("case-insensitive: SWAP behaves like swap", () => {
  assert.deepEqual(select("SWAP"), select("swap"));
});

test('filter "@smoke" selects only the @smoke-tagged spec', () => {
  assert.deepEqual(select("@smoke"), ["settings/passwordUnlock.spec.ts"]);
});

test('filter "@family-evm" matches the declared hyphenated tag', () => {
  assert.deepEqual(select("@family-evm"), ["swap/swapETH_BTC.spec.ts"]);
});

test('device tag "@NanoSP" matches every spec that declares it', () => {
  const selected = select("@NanoSP");
  assert.ok(selected.includes("swap/swapETH_BTC.spec.ts"));
  assert.ok(selected.includes("wallet40Q2/portfolio.spec.ts"));
  assert.ok(selected.includes("settings/passwordUnlock.spec.ts"));
});

test("single-file targeting by basename", () => {
  assert.deepEqual(select("portfolio.spec.ts"), ["wallet40Q2/portfolio.spec.ts"]);
});

test("folder targeting by path fragment", () => {
  assert.deepEqual(select("swap/otherTestCases"), ["swap/otherTestCases/swap_noAccountTo.spec.ts"]);
});

test("space in filter acts as OR (union of path + tag matches)", () => {
  const selected = select("@smoke swap");
  assert.ok(selected.includes("settings/passwordUnlock.spec.ts")); // @smoke tag
  assert.ok(selected.includes("swap/swapETH_BTC.spec.ts")); // swap path
  assert.ok(selected.includes("settings/swapEntryFromSettings.spec.ts")); // @swapSmoke tag
});

test('comma in filter acts as OR (documented "," separator)', () => {
  assert.deepEqual(select("@smoke,@cosmos"), [
    "cosmos/sendATOM.spec.ts", // @cosmos tag
    "settings/passwordUnlock.spec.ts", // @smoke tag
  ]);
});

test('pipe in filter acts as OR (documented "|" separator)', () => {
  assert.deepEqual(select("@smoke|@cosmos"), [
    "cosmos/sendATOM.spec.ts",
    "settings/passwordUnlock.spec.ts",
  ]);
});

test("mixed separators (space, comma, pipe) all split into OR needles", () => {
  assert.deepEqual(select("@smoke, @cosmos | @family-cosmos"), [
    "cosmos/sendATOM.spec.ts", // @cosmos
    "family/sendATOM.spec.ts", // @family-cosmos
    "settings/passwordUnlock.spec.ts", // @smoke
  ]);
});

test("duplicate basename: bare name selects both, dir disambiguates", () => {
  assert.deepEqual(select("sendATOM.spec.ts"), [
    "cosmos/sendATOM.spec.ts",
    "family/sendATOM.spec.ts",
  ]);
  assert.deepEqual(select("cosmos/sendATOM.spec.ts"), ["cosmos/sendATOM.spec.ts"]);
});

test("TMS id is no longer a valid filter (aligns with desktop; not a tag/path)", () => {
  // "@swapSmoke" file has a swap tag but the TMS id "B2CQA-2750" lives only in
  // the swap-folder spec's content; it must not select anything on its own.
  assert.deepEqual(select("B2CQA-2750"), []);
});
