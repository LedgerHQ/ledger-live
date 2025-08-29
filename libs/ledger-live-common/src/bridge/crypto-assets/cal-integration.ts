import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import { CALStore } from "./cal-store";
import { isFeature } from "../../featureFlags/firebaseFeatureFlags";

let calStoreInstance: CALStore | undefined;

export function isCALIntegrationEnabled(): boolean {
  try {
    return !getEnv("MOCK") && isFeature("calLedgerService");
  } catch (error) {
    log("cal", "Error checking CAL integration:", error);
    return false;
  }
}

export function getCALStore(): CryptoAssetsStore {
  if (!calStoreInstance) {
    calStoreInstance = new CALStore();
  }
  return calStoreInstance;
}
