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
  currency: Currency,
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
  currency: WalletAPICurrency,
): currency is WalletAPICryptoCurrency {
  return currency.type === "CryptoCurrency";
}

export function isWalletAPITokenCurrency(
  currency: WalletAPICurrency,
): currency is WalletAPIERC20TokenCurrency {
  return currency.type === "TokenCurrency";
}

export function isWalletAPIERC20TokenCurrency(
  currency: WalletAPICurrency,
): currency is WalletAPIERC20TokenCurrency {
  return (currency as WalletAPIERC20TokenCurrency).standard === "ERC20";
}

export function addParamsToURL(url: URL, inputs?: Record<string, string | undefined>): void {
  if (inputs) {
    const keys = Object.keys(inputs);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = inputs[key];

      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
  }
}

type getHostHeadersParams = {
  client: string;
  theme: "light" | "dark";
};

export function getClientHeaders(params: getHostHeadersParams): Record<string, string> {
  return {
    "x-ledger-host": params.client,
    "x-ledger-host-theme": params.theme,
  };
}

const isWhitelistedDomain = (url: string, whitelistedDomains: string[]): boolean => {
  const isValid: boolean = whitelistedDomains.reduce(
    (acc: boolean, whitelistedDomain: string) =>
      acc ? acc : new RegExp(whitelistedDomain).test(url),
    false,
  );

  if (!isValid) {
    console.error("#isWhitelistedDomain:: invalid URL: url is not whitelisted");
  }

  return isValid;
};

export const getInitialURL = (inputs, manifest) => {
  try {
    if (inputs?.goToURL) {
      const url = decodeURIComponent(inputs.goToURL);

      if (isWhitelistedDomain(url, manifest.domains)) {
        return url;
      }
    }

    const url = new URL(manifest.url);

    addParamsToURL(url, inputs);

    if (manifest.params) {
      url.searchParams.set("params", JSON.stringify(manifest.params));
    }

    return url.toString();
  } catch (e) {
    if (e instanceof Error) console.error(e.message);

    return manifest.url.toString();
  }
};

export const safeUrl = (url: string) => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};
