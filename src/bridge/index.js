// @flow

// FIXME NB: goal for "bridge/" folder is to be moved to live-common and used by desktop again!

import type { Currency, Account } from "@ledgerhq/live-common/lib/types";
import type { CurrencyBridge, AccountBridge } from "./types";
import {
  makeMockCurrencyBridge,
  makeMockAccountBridge,
} from "./makeMockBridge";

import RNLibcoreAccountBridge from "./RNLibcoreAccountBridge";

import * as RippleBridge from "./RippleJSBridge";

const mockCurrencyBridge = makeMockCurrencyBridge();
const mockAccountBridge = makeMockAccountBridge();

export const getCurrencyBridge = (currency: Currency): CurrencyBridge => {
  if (currency.family === "ripple") return RippleBridge.currencyBridge;
  return mockCurrencyBridge; // fallback mock until we implement it all!
};

export const getAccountBridge = (account: Account): AccountBridge<any> => {
  if (account.id.startsWith("mock_")) return mockAccountBridge;
  if (account.currency.family === "ripple") return RippleBridge.accountBridge;
  return RNLibcoreAccountBridge;
};
