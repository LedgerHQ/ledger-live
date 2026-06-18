import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { registerAllCoins } from "../../coin-modules/load-all-coins";
import { liveConfig } from "../../config/sharedConfig";

let ready = false;

// The Speculos transport is intentionally not registered here: it is owned by
// the app's e2e harness, keeping live-common free of any device dependency.
export function ensureE2ERuntime(): void {
  if (ready) return;
  registerAllCoins();
  LiveConfig.setConfig(liveConfig);
  setupCalClientStore();
  ready = true;
}
