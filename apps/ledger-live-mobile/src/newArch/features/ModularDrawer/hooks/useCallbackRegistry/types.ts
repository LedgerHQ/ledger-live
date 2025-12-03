import { AccountLike } from "@ledgerhq/types-live";

export type AccountCallback = (account: AccountLike, parentAccount?: AccountLike) => void;

export interface RegistryManager {
  // Callback methods
  registerCallback: (id: string, callback: AccountCallback) => void;
  getCallback: (id: string) => AccountCallback | undefined;
  unregisterCallback: (id: string) => boolean;
  hasCallback: (id: string) => boolean;
  executeCallback: (id: string, account: AccountLike, parentAccount?: AccountLike) => void;
  clearCallbacks: () => void;
  getCallbackKeys: () => string[];

  // Reset methods
  resetAll: () => void;
}
