import { makeScanAccounts } from "../../../bridge/jsHelpers";
import { CurrencyBridge } from "@ledgerhq/types-live";
import { getAccountShape } from "./bridgeHelpers/accountShape";

const scanAccounts = makeScanAccounts({ getAccountShape });

export const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};
