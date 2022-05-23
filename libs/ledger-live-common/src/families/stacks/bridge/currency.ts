import { makeScanAccounts } from "../../../bridge/jsHelpers";
import { getAccountShape } from "./utils/utils";
import { CurrencyBridge } from "../../../types";

const scanAccounts = makeScanAccounts(getAccountShape);

export const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts,
};
