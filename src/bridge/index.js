// @flow

// FIXME NB: goal for "bridge/" folder is to be moved to live-common and used by desktop again!

import type { Currency, Account } from "@ledgerhq/live-common/lib/types";
import type { CurrencyBridge, AccountBridge } from "./types";
import {
  makeMockCurrencyBridge,
  makeMockAccountBridge,
} from "./makeMockBridge";

import RNLibcoreAccountBridge from "./RNLibcoreAccountBridge";

const mockCurrencyBridge = makeMockCurrencyBridge();
const mockAccountBridge = makeMockAccountBridge();

export const getCurrencyBridge = (_currency: Currency): CurrencyBridge =>
  mockCurrencyBridge; // will stay mock while the app is read only

export const getAccountBridge = (_account: Account): AccountBridge<*> => {
  if (_account.id.startsWith("mock_")) return mockAccountBridge;
  return RNLibcoreAccountBridge;
};
