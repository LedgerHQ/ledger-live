import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { device } from "detox";
import { launchApp, isIos } from "@e2e/helpers/commonHelpers";
import { waitRemoteFlagsReady } from "@e2e/bridge/server";
import { withTimeout } from "@e2e/utils/withTimeout";
import { TIMEOUT } from "@e2e/utils/timeouts";

/** CI recreates the runner VM for every job, so a marker here lives exactly as long as the simulators. */
const WARMED_UP_SIMULATORS_DIR = path.join(os.tmpdir(), "ledger-e2e-warmed-up-simulators");

/** A cold launch plus Firebase's 60s fetch timeout. */
const SIMULATOR_WARM_UP_BUDGET = 120_000;

/** Above the warm-up budget, so the warm-up gives up before Jest fails the hook. */
export const SIMULATOR_WARM_UP_HOOK_TIMEOUT = SIMULATOR_WARM_UP_BUDGET + TIMEOUT.medium;

/**
 * Spends the first app session on each freshly booted CI iOS simulator, whose TLS connections all
 * fail and leave the app on compiled-default feature flags (QAA-1840). Never fails the spec.
 */
export async function warmUpSimulatorOnce(): Promise<void> {
  if (!process.env.CI || !isIos()) return;

  const marker = path.join(WARMED_UP_SIMULATORS_DIR, device.id);
  if (fs.existsSync(marker)) return;
  fs.mkdirSync(WARMED_UP_SIMULATORS_DIR, { recursive: true });
  fs.writeFileSync(marker, "");

  await withTimeout(
    (async () => {
      await launchApp({ newInstance: true, delete: true });
      await waitRemoteFlagsReady();
      await device.terminateApp();
    })(),
    SIMULATOR_WARM_UP_BUDGET,
    "Simulator warm-up",
  );
}
