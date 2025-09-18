import { AccountLike } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";

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

  // Observable methods
  registerObservable: (id: string, observable: Observable<WalletAPIAccount[]>) => void;
  getObservable: (id: string) => Observable<WalletAPIAccount[]> | undefined;
  unregisterObservable: (id: string) => boolean;
  hasObservable: (id: string) => boolean;
  clearObservables: () => void;
  getObservableKeys: () => string[];

  // Reset methods
  resetAll: () => void;
}
