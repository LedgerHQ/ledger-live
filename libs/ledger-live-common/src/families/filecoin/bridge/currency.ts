import { CurrencyBridge } from "@ledgerhq/types-live";
import { getAccountShape } from "./utils/utils";
import { makeScanAccounts } from "../../../bridge/jsHelpers";

const scanAccounts = makeScanAccounts({ getAccountShape });

export const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};
