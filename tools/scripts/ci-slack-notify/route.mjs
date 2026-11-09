// SPDX-FileCopyrightText: © 2026 LEDGER SAS
// SPDX-License-Identifier: Apache-2.0

import { normalizeOwner } from "./codeowners.mjs";

/** @returns {string | null} CODEOWNERS path for a coin-module CI job, or null to ignore. */
export function coinModulePathForJob(name) {
  if (name.includes("Libraries")) return "libs/coin-modules/";
  return null;
}

/** @returns {string | null} CODEOWNERS path for a short package name (e.g. "coin-tezos"), or null if unrecognised. */
export function packageToModulePath(pkg) {
  if (pkg === "coin-service") return null;
  if (pkg.startsWith("coin-")) return `libs/coin-modules/${pkg}/`;
  return null;
}

export function channelsForOwners(owners, ownerToChannel) {
  const channels = new Set();
  for (const owner of owners) {
    const channel = ownerToChannel[normalizeOwner(owner)];
    if (channel) channels.add(channel);
  }
  return [...channels];
}
