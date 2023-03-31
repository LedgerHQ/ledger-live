import { isCryptoCurrency, isTokenCurrency } from "../currencies";
import { Currency } from "@ledgerhq/types-cryptoassets";
import {
  WalletAPICurrency,
  WalletAPISupportedCurrency,
  WalletAPIERC20TokenCurrency,
  WalletAPICryptoCurrency,
} from "./types";
import { WALLET_API_FAMILIES } from "./constants";
import { includes } from "../helpers";

export function isWalletAPISupportedCurrency(
  currency: Currency
): currency is WalletAPISupportedCurrency {
  if (isCryptoCurrency(currency)) {
    return includes(WALLET_API_FAMILIES, currency.family);
  }
  if (isTokenCurrency(currency)) {
    return includes(WALLET_API_FAMILIES, currency.parentCurrency.family);
  }
  return false;
}

export function isWalletAPICryptoCurrency(
  currency: WalletAPICurrency
): currency is WalletAPICryptoCurrency {
  return currency.type === "CryptoCurrency";
}

export function isWalletAPITokenCurrency(
  currency: WalletAPICurrency
): currency is WalletAPIERC20TokenCurrency {
  return currency.type === "TokenCurrency";
}

export function isWalletAPIERC20TokenCurrency(
  currency: WalletAPICurrency
): currency is WalletAPIERC20TokenCurrency {
  return (currency as WalletAPIERC20TokenCurrency).standard === "ERC20";
}

export function addParamsToURL(
  url: URL,
  inputs?: Record<string, string>
): void {
  if (inputs) {
    const keys = Object.keys(inputs);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = inputs[key];

      url.searchParams.set(key, value);
    }
  }
}

type getHostHeadersParams = {
  client: string;
  theme: "light" | "dark";
};

export function getClientHeaders(
  params: getHostHeadersParams
): Record<string, string> {
  return {
    "x-ledger-host": params.client,
    "x-ledger-host-theme": params.theme,
  };
}
