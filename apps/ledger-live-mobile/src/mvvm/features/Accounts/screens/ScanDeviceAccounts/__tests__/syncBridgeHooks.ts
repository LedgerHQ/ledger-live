import { EMPTY, type Observable } from "rxjs";
import type { ScanAccountEvent } from "@ledgerhq/types-live";

let scanObservable: Observable<ScanAccountEvent> = EMPTY;

export const setSyncScanObservable = (observable: Observable<ScanAccountEvent>) => {
  scanObservable = observable;
};

const currencyBridge = {
  scanAccounts: () => scanObservable,
  preload: () => Promise.resolve(undefined),
  hydrate: () => {},
};

export const currencyBridgeHook = {
  __esModule: true,
  useCurrencyBridge: () => currencyBridge,
};

export const accountBridgeHook = {
  __esModule: true,
  useAccountBridgeOrNull: () => ({ isAccountEmpty: () => false }),
};
