// SPDX-FileCopyrightText: © 2026 LEDGER SAS
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeOwner, ownersForPath, parseCodeowners } from "./codeowners.mjs";

test("parseCodeowners - skips blank lines and comments", () => {
  const rules = parseCodeowners("# comment\n\n* @owner1\n");
  assert.deepEqual(rules, [{ pattern: "*", owners: ["@owner1"] }]);
});

test("parseCodeowners - parses multiple owners per pattern", () => {
  const rules = parseCodeowners(
    "libs/coin-modules/coin-tezos/ @ledgerhq/hoodies @ledgerhq/leads\n",
  );
  assert.deepEqual(rules, [
    { pattern: "libs/coin-modules/coin-tezos/", owners: ["@ledgerhq/hoodies", "@ledgerhq/leads"] },
  ]);
});

test("parseCodeowners - skips lines with no owners", () => {
  const rules = parseCodeowners("libs/foo/\n");
  assert.deepEqual(rules, []);
});

test("normalizeOwner - lowercases", () => {
  assert.equal(normalizeOwner("@LedgerHQ/Coin-Integration"), "@ledgerhq/coin-integration");
});

test("ownersForPath - wildcard * matches any path", () => {
  const rules = parseCodeowners("* @owner1\n");
  assert.deepEqual(ownersForPath(rules, "anything/at/all"), ["@owner1"]);
});

test("ownersForPath - last matching rule wins", () => {
  const rules = parseCodeowners("* @owner1\nlibs/coin-modules/coin-tezos/ @owner2\n");
  assert.deepEqual(ownersForPath(rules, "libs/coin-modules/coin-tezos/"), ["@owner2"]);
});

test("ownersForPath - specific rule does not match sibling path", () => {
  const rules = parseCodeowners("* @owner1\nlibs/coin-modules/coin-tezos/ @owner2\n");
  assert.deepEqual(ownersForPath(rules, "libs/coin-modules/coin-evm/"), ["@owner1"]);
});

test("ownersForPath - matches path that starts with the rule prefix", () => {
  const rules = parseCodeowners("libs/coin-modules/coin-tezos/ @owner2\n");
  assert.deepEqual(ownersForPath(rules, "libs/coin-modules/coin-tezos/src/index.ts"), ["@owner2"]);
});

test("ownersForPath - no match returns empty array", () => {
  const rules = parseCodeowners("libs/coin-modules/coin-tezos/ @owner2\n");
  assert.deepEqual(ownersForPath(rules, "apps/coin-service/"), []);
});
