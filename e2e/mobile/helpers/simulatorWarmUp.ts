import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { device, log } from "detox";
import { sanitizeError } from "@ledgerhq/live-e2e-shared/index";
import { launchApp, isIos } from "@e2e/helpers/commonHelpers";
import { waitRemoteFlagsReady } from "@e2e/bridge/server";
import { TIMEOUT } from "@e2e/utils/timeouts";

/** CI recreates the runner VM for every job, so a marker here lives exactly as long as the simulators. */
const WARMED_UP_SIMULATORS_DIR = path.join(os.tmpdir(), "ledger-e2e-warmed-up-simulators");

/** Same budget as the launch hook in setup.ts: a cold launch of a freshly installed app. */
const WARM_UP_LAUNCH_BUDGET = 150_000;

/** `waitRemoteFlagsReady` gives up on its own after TIMEOUT.xxlarge; the rest is for `terminateApp`. */
const WARM_UP_AFTER_LAUNCH_BUDGET = TIMEOUT.xxlarge + TIMEOUT.medium;

export const SIMULATOR_WARM_UP_HOOK_TIMEOUT = WARM_UP_LAUNCH_BUDGET + WARM_UP_AFTER_LAUNCH_BUDGET;

/**
 * Spends the first app session on each freshly booted CI iOS simulator, whose TLS connections all
 * fail and leave the app on compiled-default feature flags (QAA-1840). Never fails the spec.
 *
 * Every step is awaited in turn, never raced, so no warm-up command can land on the app that the
 * next hook launches. A launch slow enough that Jest may have abandoned this hook ends the warm-up.
 */
export async function warmUpSimulatorOnce(): Promise<void> {
  if (!process.env.CI || !isIos()) return;

  const marker = path.join(WARMED_UP_SIMULATORS_DIR, device.id);
  if (fs.existsSync(marker)) return;
  fs.mkdirSync(WARMED_UP_SIMULATORS_DIR, { recursive: true });
  fs.writeFileSync(marker, "");

  try {
    const launchStartedAt = Date.now();
    await launchApp({ newInstance: true, delete: true });
    if (Date.now() - launchStartedAt > WARM_UP_LAUNCH_BUDGET) {
      log.warn("Simulator warm-up launch exceeded its budget; skipping the rest of the warm-up");
      return;
    }
    await waitRemoteFlagsReady();
    await device.terminateApp();
  } catch (error) {
    log.warn(`Simulator warm-up failed: ${sanitizeError(error)}`);
  }
}
