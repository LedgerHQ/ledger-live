import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const OXLINT = fileURLToPath(new URL("../node_modules/.bin/oxlint", import.meta.url));
const LEGACY = "libs/ledger-wallet-framework/src/derivation.ts";
const MIRROR = "domain/entity/derivation/src/modes.internals.ts";

const legacy = ({ skip = 10, scheme = "44'/60'/0'/<account>" } = {}) => `
const modes = Object.freeze({
  "": {},
  ethM: { mandatoryEmptyAccountSkip: ${skip}, overridesDerivation: "${scheme}", tag: "legacy" },
});
const legacyDerivations: Partial<Record<string, DerivationMode[]>> = { ethereum: ["ethM"] };
const mandatoryEmptyAccountSkipByCurrency = { hypercore: 10 };
const disableBIP44: Record<string, boolean> = { tezos: true, solana: true };
`;

const mirror = ({ withoutBip44 = `"solana", "tezos"` } = {}) => `
export const DERIVATION_MODES = {
  "": {},
  ethM: { mandatoryEmptyAccountSkip: 10, overridesDerivation: derivationScheme("44'/60'/0'/<account>") },
} as const satisfies Record<string, DerivationModeSpec>;
export const LEGACY_MODES = byCurrency<readonly DerivationMode[]>({ ethereum: ["ethM"] });
export const WITHOUT_BIP44 = currencies(${withoutBip44});
export const MANDATORY_EMPTY_ACCOUNT_SKIP_BY_CURRENCY = byCurrency<number>({ hypercore: 10 });
`;

/**
 * @param {{ legacy: string, mirror: string }} files
 * @returns {string[]} `file:line` of each report, sorted
 */
function lint(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "derivation-mirror-test-"));
  const all = {
    ".oxlintrc.json": JSON.stringify({
      plugins: ["typescript"],
      jsPlugins: [fileURLToPath(new URL("./derivation-mirror.js", import.meta.url))],
      rules: { "derivation-mirror/in-step": "error" },
    }),
    [LEGACY]: files.legacy,
    [MIRROR]: files.mirror,
  };
  for (const [file, content] of Object.entries(all)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  const { status, stdout, stderr } = spawnSync(OXLINT, ["--format", "unix", "."], {
    cwd: root,
    encoding: "utf8",
  });
  assert.ok(status === 0 || status === 1, `oxlint exited ${status}: ${stderr}${stdout}`);
  return stdout
    .split("\n")
    .filter(line => line.includes("derivation-mirror(in-step)"))
    .map(line => line.split(":").slice(0, 2).join(":"))
    .sort();
}

test("is silent while both copies agree, whatever the key order and the extra legacy fields", () => {
  assert.deepEqual(lint({ legacy: legacy(), mirror: mirror() }), []);
});

test("reports a changed mode field on both copies", () => {
  assert.deepEqual(lint({ legacy: legacy({ skip: 5 }), mirror: mirror() }), [
    `${MIRROR}:2`,
    `${LEGACY}:2`,
  ]);
});

test("reports a changed scheme", () => {
  assert.equal(
    lint({ legacy: legacy({ scheme: "44'/60'/1'/<account>" }), mirror: mirror() }).length,
    2,
  );
});

test("reports a currency on one side only", () => {
  assert.deepEqual(lint({ legacy: legacy(), mirror: mirror({ withoutBip44: `"tezos"` }) }), [
    `${MIRROR}:7`,
    `${LEGACY}:8`,
  ]);
});

test("reads a single id as a one-id set", () => {
  const oneId = {
    legacy: legacy().replace("tezos: true, solana: true", "tezos: true"),
    mirror: mirror({ withoutBip44: `"tezos"` }),
  };
  assert.deepEqual(lint(oneId), []);
});

test("reads a call other than the table helpers as no literal", () => {
  const computed = mirror().replace(`byCurrency<number>({ hypercore: 10 })`, "Math.max(10)");
  assert.equal(lint({ legacy: legacy(), mirror: computed }).length, 2);
});

test("reports a mirrored table that is no longer a literal", () => {
  const notLiteral = mirror().replace(`byCurrency<number>({ hypercore: 10 })`, "computeSkips()");
  assert.equal(lint({ legacy: legacy(), mirror: notLiteral }).length, 2);
});
