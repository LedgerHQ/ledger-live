import path from "path";
import { setEnv } from "@ledgerhq/live-env";
import { NANO_APP_CATALOG_PATH } from "../../mobile/utils/constants";
import { ARTIFACTS_DIR } from "./paths";

export function setupE2EEnvironment() {
  setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);
  setEnv("MOCK", "");
  setEnv("DETOX", "1");
  setEnv("E2E_NANO_APP_VERSION_PATH", NANO_APP_CATALOG_PATH);
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);

  process.env.E2E_BRIDGE = "1";
  process.env.DETOX = "1";
  process.env.MOCK = "";
  process.env.DISABLE_TRANSACTION_BROADCAST = "1";
  process.env.E2E_BRIDGE_QUIET = "1";
  if (!process.env.SPECULOS_TRACKING_FILE) {
    process.env.SPECULOS_TRACKING_FILE = path.join(ARTIFACTS_DIR, "speculos-instances.json");
  }
}
