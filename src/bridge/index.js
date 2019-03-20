// @flow

// FIXME NB: goal for "bridge/" folder is to be moved to live-common and used by desktop again!

import type { CryptoCurrency, Account } from "@ledgerhq/live-common/lib/types";
import * as RippleBridge from "@ledgerhq/live-common/lib/bridge/RippleJSBridge";
import * as EthereumBridge from "@ledgerhq/live-common/lib/bridge/EthereumJSBridge";
import type {
  CurrencyBridge,
  AccountBridge,
} from "@ledgerhq/live-common/lib/bridge/types";
import {
  makeMockCurrencyBridge,
  makeMockAccountBridge,
} from "@ledgerhq/live-common/lib/bridge/makeMockBridge";

import RNLibcoreAccountBridge from "./RNLibcoreAccountBridge";
import RNLibcoreCurrencyBridge from "./RNLibcoreCurrencyBridge";

const mockCurrencyBridge = makeMockCurrencyBridge();
const mockAccountBridge = makeMockAccountBridge();

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
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
  // $FlowFixMe i don't get where it fails
  if (account.id.startsWith("mock")) return mockAccountBridge;
  switch (account.currency.family) {
    case "ripple":
      // $FlowFixMe i don't get where it fails
      return RippleBridge.accountBridge;
    case "ethereum":
      // $FlowFixMe i don't get where it fails
      return EthereumBridge.accountBridge;
    default:
      // $FlowFixMe i don't get where it fails
      return RNLibcoreAccountBridge;
  }
};
