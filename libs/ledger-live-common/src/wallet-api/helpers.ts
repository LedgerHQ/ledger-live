import { isCryptoCurrency, isTokenCurrency } from "../currencies";
import { Currency } from "@ledgerhq/types-cryptoassets";
import type {
  WalletAPICurrency,
  WalletAPISupportedCurrency,
  WalletAPIERC20TokenCurrency,
  WalletAPICryptoCurrency,
  AppManifest,
} from "./types";
import { WALLET_API_FAMILIES } from "./constants";
import { includes } from "../helpers";
import { isSameDomain } from "./manifestDomainUtils";

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
  return currency.type === "TokenCurrency" && currency.standard === "ERC20";
}

export function addParamsToURL(
  url: URL,
  inputs?: Record<string, string | boolean | undefined>,
): void {
  if (inputs) {
    const keys = Object.keys(inputs);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = inputs[key];

      if (value !== undefined) {
        url.searchParams.set(key, String(value));
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

/**
 * Validates a URL by checking if it's on the same domain as the manifest URL.
 * Only HTTPS URLs are allowed.
 * @param url - The URL to validate
 * @param manifestUrl - The manifest URL to check same domain against
 * @returns true if the URL is valid and is on the same domain as manifestUrl
 */
const isWhitelistedDomain = (url: string, manifestUrl: string): boolean => {
  try {
    // Parse the URL
    const parsedUrl = new URL(url);

    // Only allow HTTPS scheme
    if (parsedUrl.protocol !== "https:") {
      console.error(
        `#isWhitelistedDomain:: invalid URL: non-HTTPS scheme '${parsedUrl.protocol}' is not allowed`,
      );
      return false;
    }

    // Check if URL is on the same domain as manifest URL
    if (!isSameDomain(url, manifestUrl)) {
      console.error(`#isWhitelistedDomain:: invalid URL: not on the same domain as manifest URL`);
      return false;
    }

    return true;
  } catch (error) {
    // Invalid URL format
    console.error(`#isWhitelistedDomain:: invalid URL format: ${error}`);
    return false;
  }
};

export const getInitialURL = (
  inputs: Record<string, string | boolean | undefined> | undefined,
  manifest: AppManifest,
) => {
  try {
    if (
      typeof inputs?.goToURL === "string" &&
      isWhitelistedDomain(inputs.goToURL, manifest.url.toString())
    ) {
      return inputs?.goToURL;
    }

    const url = new URL(manifest.url.toString());

    // Filter out goToURL from inputs to prevent it from being added as a query parameter
    // when validation fails
    const { goToURL, ...filteredInputs } = inputs || {};

    addParamsToURL(url, filteredInputs);

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

// Copied from https://www.npmjs.com/package/ethereumjs-util
export const isHexPrefixed = (str: string): boolean => {
  if (typeof str !== "string") {
    throw new Error(`[isHexPrefixed] input must be type 'string', received type ${typeof str}`);
  }

  return str[0] === "0" && str[1] === "x";
};

// Copied from https://www.npmjs.com/package/ethereumjs-util
export const stripHexPrefix = (str: string): string => {
  if (typeof str !== "string")
    throw new Error(`[stripHexPrefix] input must be type 'string', received ${typeof str}`);

  return isHexPrefixed(str) ? str.slice(2) : str;
};

export function objectToURLSearchParams(obj: Record<string, unknown>): URLSearchParams {
  const searchParams = new URLSearchParams();

  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (typeof value === "object") {
        searchParams.append(key, JSON.stringify(value));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  return searchParams;
}
