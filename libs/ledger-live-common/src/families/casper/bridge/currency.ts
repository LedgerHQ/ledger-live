import { makeScanAccounts } from "../../../bridge/jsHelpers";
import { getAccountShape } from "../utils";
import { CurrencyBridge } from "@ledgerhq/types-live";

const scanAccounts = makeScanAccounts({ getAccountShape });

export const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};
