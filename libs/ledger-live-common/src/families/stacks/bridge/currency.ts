import { CurrencyBridge } from "@ledgerhq/types-live";
import { makeScanAccounts } from "../../../bridge/jsHelpers";
import { getAccountShape } from "../synchronization";

const scanAccounts = makeScanAccounts({ getAccountShape });

export const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};
