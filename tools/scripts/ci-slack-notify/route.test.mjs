// SPDX-FileCopyrightText: © 2026 LEDGER SAS
// SPDX-License-Identifier: Apache-2.0

import assert from "node:assert/strict";
import { test } from "node:test";
import { channelsForOwners, coinModulePathForJob, packageToModulePath } from "./route.mjs";

// --- coinModulePathForJob ---

test("coinModulePathForJob - Libraries job returns generic path", () => {
  assert.equal(coinModulePathForJob("🧪 Libraries - Integration Tests"), "libs/coin-modules/");
});

test("coinModulePathForJob - non-Libraries job returns null", () => {
  assert.equal(coinModulePathForJob("🧪 Service - Tests"), null);
  assert.equal(coinModulePathForJob("📣 Notify Slack"), null);
});

// --- packageToModulePath ---

test("packageToModulePath - coin-tezos", () => {
  assert.equal(packageToModulePath("coin-tezos"), "libs/coin-modules/coin-tezos/");
});

test("packageToModulePath - coin-evm", () => {
  assert.equal(packageToModulePath("coin-evm"), "libs/coin-modules/coin-evm/");
});

test("packageToModulePath - coin-service returns null (excluded from NX run)", () => {
  assert.equal(packageToModulePath("coin-service"), null);
});

test("packageToModulePath - unknown package returns null", () => {
  assert.equal(packageToModulePath("some-random-package"), null);
  assert.equal(packageToModulePath(""), null);
});

// --- channelsForOwners ---

const ownerToChannel = {
  "@ledgerhq/coin-integration": "C_COIN_INTEG",
  "@ledgerhq/ledger-partner-hoodies": "C_HOODIES",
};

test("channelsForOwners - maps known owner to channel", () => {
  assert.deepEqual(channelsForOwners(["@ledgerhq/coin-integration"], ownerToChannel), [
    "C_COIN_INTEG",
  ]);
});

test("channelsForOwners - ignores unknown owners", () => {
  assert.deepEqual(
    channelsForOwners(["@LedgerHQ/cloud-wallet", "@ComradeAERGO"], ownerToChannel),
    [],
  );
});

test("channelsForOwners - deduplicates channels", () => {
  const channels = channelsForOwners(
    ["@ledgerhq/coin-integration", "@ledgerhq/coin-integration"],
    ownerToChannel,
  );
  assert.deepEqual(channels, ["C_COIN_INTEG"]);
});

test("channelsForOwners - normalises owner case before lookup", () => {
  assert.deepEqual(channelsForOwners(["@LedgerHQ/Coin-Integration"], ownerToChannel), [
    "C_COIN_INTEG",
  ]);
});
