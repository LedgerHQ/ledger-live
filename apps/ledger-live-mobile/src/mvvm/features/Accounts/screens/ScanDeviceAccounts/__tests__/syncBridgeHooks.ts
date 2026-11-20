import { EMPTY, type Observable } from "rxjs";
import type { ScanAccountEvent } from "@ledgerhq/types-live";

/**
 * Synchronous bridge hooks for view model tests. Mock both modules with these exports:
 *
 * jest.mock("@ledgerhq/live-common/bridge/useCurrencyBridge", () => require("./syncBridgeHooks").currencyBridgeHook);
 * jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => require("./syncBridgeHooks").accountBridgeHook);
 *
 * The currency bridge is a new object on each render, so each render re-runs the scan effect.
 */
let scanObservable: Observable<ScanAccountEvent> = EMPTY;

export const setSyncScanObservable = (observable: Observable<ScanAccountEvent>) => {
  scanObservable = observable;
};

export const currencyBridgeHook = {
  __esModule: true,
  useCurrencyBridge: () => ({
    scanAccounts: () => scanObservable,
    preload: () => Promise.resolve(undefined),
    hydrate: () => {},
  }),
};

export const accountBridgeHook = {
  __esModule: true,
  useAccountBridgeOrNull: () => ({ isAccountEmpty: () => false }),
};
