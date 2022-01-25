import { CurrencyNotSupported } from "@ledgerhq/errors";
import type {
  CryptoCurrency,
  Account,
  AccountLike,
  CurrencyBridge,
  AccountBridge,
} from "../types";
import { decodeAccountId, getMainAccount } from "../account";
import { getEnv } from "../env";
import { checkAccountSupported, shouldUseJS } from "../account/support";
import jsBridges from "../generated/bridge/js";
import mockBridges from "../generated/bridge/mock";
import libcoreBridges from "../generated/bridge/libcore";
export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  if (getEnv("MOCK")) {
    const mockBridge = mockBridges[currency.family];
    if (mockBridge) return mockBridge.currencyBridge;
    throw new CurrencyNotSupported(
      "no mock implementation available for currency " + currency.id,
      {
        currencyName: currency.name,
      }
    );
  }

  const jsBridge = jsBridges[currency.family];
  const libcoreBridge = libcoreBridges[currency.family];

  if (jsBridge && (!libcoreBridge || shouldUseJS(currency))) {
    return jsBridge.currencyBridge;
  }

  if (libcoreBridge) {
    return libcoreBridge.currencyBridge;
  }

  throw new CurrencyNotSupported(
    "no implementation available for currency " + currency.id,
    {
      currencyName: currency.name,
    }
  );
};
export const getAccountBridge = (
  account: AccountLike,
  parentAccount: Account | null | undefined
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
    if (mockBridge) return mockBridge.accountBridge;
    throw new CurrencyNotSupported(
      "no mock implementation available for currency " + currency.id,
      {
        currencyName: currency.name,
      }
    );
  }

  const jsBridge = jsBridges[family];

  if (type === "libcore") {
    if (jsBridge && shouldUseJS(currency)) {
      return jsBridge.accountBridge;
    }

    // TODO at this point, we might want to check if an impl in JS exists
    // and if it's not flagged as experimental, we make an implicit migration that would happen to change ids and change bridge implementation
    // FIXME: how will addAccount reconciliate accounts?
    const libcoreBridge = libcoreBridges[family];
    if (libcoreBridge) return libcoreBridge.accountBridge;
    throw new CurrencyNotSupported(
      "no libcore implementation available for currency " + currency.id,
      {
        currencyName: currency.name,
      }
    );
  }

  if (jsBridge) return jsBridge.accountBridge;
  throw new CurrencyNotSupported("currency not supported " + currency.id, {
    currencyName: mainAccount.currency.name,
  });
};
