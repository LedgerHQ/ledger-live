/**
 * One-call setup: app booted, onboarding skipped, accounts pre-seeded
 * (BTC + ETH + POL — addresses match the Speculos test SEED), and a
 * Speculos instance for `appName` wired in as the connected device.
 *
 * After this returns, the app behaves as if the user already paired a
 * device and added accounts — you can drive Receive / Send / etc. without
 * any "Add account" UI flow.
 *
 * Pre-reqs (env): SEED, COINAPPS (local) or REMOTE_SPECULOS=true + SPECULINHO_URL.
 */
import { launchApp } from "./launchApp";
import { loadConfig } from "./loadConfig";
import { launchSpeculos, SpeculosHandle } from "./speculos";
import { specs } from "@ledgerhq/live-common/e2e/speculos";

export async function setupDeviceReady(appName: keyof typeof specs): Promise<SpeculosHandle> {
  await launchApp();
  // device-ready.json bakes accounts whose addresses match the standard
  // Live e2e SEED. Pair it with that same SEED in env or addresses won't verify.
  await loadConfig("device-ready");
  return launchSpeculos(appName);
}
