import type {
  CryptoCurrency,
  Account,
  AccountLike,
  CurrencyBridge,
  AccountBridge,
  ScanAccountEventRaw,
  ScanAccountEvent,
} from "../types";
import { fromAccountRaw, toAccountRaw } from "../account";
import * as impl from "./impl";
export type Proxy = {
  getAccountBridge: typeof getAccountBridge;
  getCurrencyBridge: typeof getCurrencyBridge;
};
let proxy: Proxy | null | undefined;
export const setBridgeProxy = (p: Proxy | null | undefined) => {
  if (p && p.getAccountBridge === getAccountBridge) {
    throw new Error(
      "setBridgeProxy can't be called with same bridge functions!"
    );
  }

  proxy = p;
};
export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge =>
  (proxy || impl).getCurrencyBridge(currency);
export const getAccountBridge = (
  account: AccountLike,
  parentAccount?: Account | null | undefined
): AccountBridge<any> =>
  (proxy || impl).getAccountBridge(account, parentAccount);
export function fromScanAccountEventRaw(
  raw: ScanAccountEventRaw
): ScanAccountEvent {
  switch (raw.type) {
    case "discovered":
      return {
        type: raw.type,
        account: fromAccountRaw(raw.account),
      };

    default:
      throw new Error("unsupported ScanAccountEvent " + raw.type);
  }
}
export function toScanAccountEventRaw(
  e: ScanAccountEvent
): ScanAccountEventRaw {
  switch (e.type) {
    case "discovered":
      return {
        type: e.type,
        account: toAccountRaw(e.account),
      };

    default:
      throw new Error("unsupported ScanAccountEvent " + e.type);
  }
}
