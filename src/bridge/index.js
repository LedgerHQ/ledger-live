// @flow
import { createCustomErrorClass } from "@ledgerhq/errors";
import type { CryptoCurrency, Account } from "../types";
import type { CurrencyBridge, AccountBridge } from "./types";
import { decodeAccountId } from "../account";
import { getEnv } from "../env";
import * as RippleJSBridge from "./RippleJSBridge";
import * as EthereumJSBridge from "./EthereumJSBridge";
import LibcoreCurrencyBridge from "./LibcoreCurrencyBridge";
import LibcoreBitcoinAccountBridge from "./LibcoreBitcoinAccountBridge";
import LibcoreEthereumAccountBridge from "./LibcoreEthereumAccountBridge";
import {
  makeMockCurrencyBridge,
  makeMockAccountBridge
} from "./makeMockBridge";

// TODO as soon as it's in @ledgerhq/errors we can import it
const CurrencyNotSupported = createCustomErrorClass("CurrencyNotSupported");

const mockCurrencyBridge = makeMockCurrencyBridge();
const mockAccountBridge = makeMockAccountBridge();

export const getCurrencyBridge = (currency: CryptoCurrency): CurrencyBridge => {
  if (getEnv("MOCK")) return mockCurrencyBridge;
  switch (currency.family) {
    case "ripple":
      return RippleJSBridge.currencyBridge;
    case "ethereum":
      return EthereumJSBridge.currencyBridge;
    case "bitcoin":
      return LibcoreCurrencyBridge;
    default:
      return mockCurrencyBridge; // fallback mock until we implement it all!
  }
};

export const getAccountBridge = (account: Account): AccountBridge<any> => {
  const { type } = decodeAccountId(account.id);
  if (type === "mock") return mockAccountBridge;
  if (type === "libcore") {
    if (account.currency.family === "ethereum") {
      return LibcoreEthereumAccountBridge;
    }
    return LibcoreBitcoinAccountBridge;
  }
  switch (account.currency.family) {
    case "ripple":
      return RippleJSBridge.accountBridge;
    case "ethereum":
      return EthereumJSBridge.accountBridge;
    default:
      throw new CurrencyNotSupported("currency not supported", {
        currencyName: account.currency.name
      });
  }
};
