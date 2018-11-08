// @flow

// FIXME NB: goal for "bridge/" folder is to be moved to live-common and used by desktop again!

import type { Currency, Account } from "@ledgerhq/live-common/lib/types";
import type { CurrencyBridge, AccountBridge } from "./types";
import {
  makeMockCurrencyBridge,
  makeMockAccountBridge,
} from "./makeMockBridge";

import RNLibcoreAccountBridge from "./RNLibcoreAccountBridge";
import RNLibcoreCurrencyBridge from "./RNLibcoreCurrencyBridge";

import * as RippleBridge from "./RippleJSBridge";
import * as EthereumBridge from "./EthereumJSBridge";

const mockCurrencyBridge = makeMockCurrencyBridge();
const mockAccountBridge = makeMockAccountBridge();

export const getCurrencyBridge = (currency: Currency): CurrencyBridge => {
  switch (currency.family) {
    case "ripple":
      return RippleBridge.currencyBridge;
    case "ethereum":
      return EthereumBridge.currencyBridge;
    case "bitcoin":
      return RNLibcoreCurrencyBridge;
    default:
      return mockCurrencyBridge; // fallback mock until we implement it all!
  }
};

export const getAccountBridge = (account: Account): AccountBridge<any> => {
  if (account.id.startsWith("mock")) return mockAccountBridge;
  switch (account.currency.family) {
    case "ripple":
      return RippleBridge.accountBridge;
    case "ethereum":
      return EthereumBridge.accountBridge;
    default:
      return RNLibcoreAccountBridge;
  }
};
