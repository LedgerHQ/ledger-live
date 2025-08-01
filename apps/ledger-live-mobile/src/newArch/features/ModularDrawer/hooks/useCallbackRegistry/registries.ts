import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { Registry } from "./Registry";
import { AccountCallback } from "./types";

// Global registries that persist across re-renders
export const callbackRegistry = new Registry<AccountCallback>();
export const observableRegistry = new Registry<Observable<WalletAPIAccount[]>>();

/**
 * Reset all registries - should be called during app reset/cleanup
 */
export const resetAllRegistries = () => {
  callbackRegistry.clear();
  observableRegistry.clear();
};
