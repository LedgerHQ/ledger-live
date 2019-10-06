// @flow
import { CurrencyNotSupported } from "@ledgerhq/errors";
import type {
  CryptoCurrency,
  Account,
  AccountLike,
  CurrencyBridge,
  AccountBridge
} from "../types";
import { decodeAccountId, getMainAccount } from "../account";
import { getEnv } from "../env";
import { checkAccountSupported, libcoreNoGo } from "../account/support";

import jsBridges from "../generated/bridge/js";
import mockBridges from "../generated/bridge/mock";
import libcoreBridges from "../generated/bridge/libcore";

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  const forceImpl = getEnv("BRIDGE_FORCE_IMPLEMENTATION");
  if (getEnv("MOCK") || forceImpl === "mock") {
    const mockBridge = mockBridges[currency.family];
    if (mockBridge) {
      return mockBridge.currencyBridge;
    }
    throw new CurrencyNotSupported(
      "no mock implementation available for currency " + currency.id,
      {
        currencyName: currency.name
      }
    );
  }
  if (forceImpl === "js" || (!forceImpl && libcoreNoGo.includes(currency.id))) {
    const jsBridge = jsBridges[currency.family];
    if (jsBridge) return jsBridge.currencyBridge;
  } else {
    const bridge = libcoreBridges[currency.family];
    if (bridge) {
      return bridge.currencyBridge;
    }
  }
  throw new CurrencyNotSupported(
    "no implementation available for currency " + currency.id,
    {
      currencyName: currency.name
    }
  );
};

export const getAccountBridge = (
  account: AccountLike,
  parentAccount: ?Account
): AccountBridge<any> => {
  const mainAccount = getMainAccount(account, parentAccount);
  const { currency } = mainAccount;
  const { family } = currency;
  const { type } = decodeAccountId(mainAccount.id);
  const supportedError = checkAccountSupported(mainAccount);
  if (supportedError) {
    throw supportedError;
  }
  if (type === "mock") {
    const mockBridge = mockBridges[currency.family];
    if (mockBridge) {
      return mockBridge.accountBridge;
    }
    throw new CurrencyNotSupported(
      "no mock implementation available for currency " + currency.id,
      {
        currencyName: currency.name
      }
    );
  }
  if (type === "libcore") {
    const libcoreBridge = libcoreBridges[family];
    if (libcoreBridge) return libcoreBridge.accountBridge;
    throw new CurrencyNotSupported(
      "no libcore implementation available for currency " + currency.id,
      {
        currencyName: currency.name
      }
    );
  }
  const jsBridge = jsBridges[family];
  if (jsBridge) {
    return jsBridge.accountBridge;
  }
  throw new CurrencyNotSupported("currency not supported " + currency.id, {
    currencyName: mainAccount.currency.name
  });
};
