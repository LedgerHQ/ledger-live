import { CurrencyNotSupported } from "@ledgerhq/errors";
import { decodeAccountId, getMainAccount } from "../account";
import { getEnv } from "@ledgerhq/live-env";
import { checkAccountSupported } from "../account/index";
import jsBridges from "../generated/bridge/js";
import mockBridges from "../generated/bridge/mock";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountBridge, AccountLike, CurrencyBridge } from "@ledgerhq/types-live";
import { getAlpacaAccountBridge } from "./generic-alpaca/accountBridge";
import { getAlpacaCurrencyBridge } from "./generic-alpaca/currencyBridge";

const alpacaized = {
  xrp: true,
  stellar: true,
};

// let accountBridgeInstance: AccountBridge<any> | null = null;
const bridgeCache: Record<string, AccountBridge<any>> = {};
let currencyBridgeInstance: CurrencyBridge | null = null;

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  // console.log("getCurrencyBridge", currency.id, currency.family);
  if (getEnv("MOCK")) {
    const mockBridge = mockBridges[currency.family];
    if (mockBridge) return mockBridge.currencyBridge;
    throw new CurrencyNotSupported("no mock implementation available for currency " + currency.id, {
      currencyName: currency.id,
    });
  }

  if (alpacaized[currency.family]) {
    // console.log("getAlpacaCurrencyBridge", currency.family);
    // if (!currencyBridgeInstance) {
    //   console.log("Creating new Alpaca currency bridge instance for", currency.family);
    //   currencyBridgeInstance = getAlpacaCurrencyBridge(currency.family, "local");
    // }
    return getAlpacaCurrencyBridge(currency.family, "local");
  }

  const jsBridge = jsBridges[currency.family];
  if (jsBridge) {
    return jsBridge.currencyBridge;
  }

  throw new CurrencyNotSupported("no implementation available for currency " + currency.id, {
    currencyName: currency.id,
  });
};

export const getAccountBridge = (
  account: AccountLike,
  parentAccount?: Account | null,
): AccountBridge<any> => {
  // console.log("getAccountBridge", account);
  const mainAccount = getMainAccount(account, parentAccount);
  const { currency } = mainAccount;
  const supportedError = checkAccountSupported(mainAccount);

  if (supportedError) {
    throw supportedError;
  }

  try {
    return getAccountBridgeByFamily(currency.family, mainAccount.id);
  } catch {
    throw new CurrencyNotSupported("currency not supported " + currency.id, {
      currencyName: currency.id,
    });
  }
};

export function getAccountBridgeByFamily(family: string, accountId?: string): AccountBridge<any> {
  // console.log("getAccountBridgeByFamily", family);
  if (accountId) {
    const { type } = decodeAccountId(accountId);

    if (type === "mock") {
      const mockBridge = mockBridges[family];
      if (mockBridge) return mockBridge.accountBridge;
    }
  }

  if (alpacaized[family]) {
    if (!bridgeCache[family]) {
      bridgeCache[family] = getAlpacaAccountBridge(family, "local");
    }
    return bridgeCache[family];
  }

  const jsBridge = jsBridges[family];
  if (!jsBridge) {
    throw new CurrencyNotSupported("account bridge not found " + family);
  }
  return jsBridge.accountBridge;
}
