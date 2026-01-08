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

/**
 * Normalizes a hostname to lowercase and converts internationalized domain names to punycode.
 * @param hostname - The hostname to normalize
 * @returns The normalized hostname
 */
function normalizeHostname(hostname: string): string {
  try {
    // Create a URL with a dummy protocol to leverage URL normalization
    const url = new URL(`https://${hostname}`);
    // URL constructor already handles punycode conversion and lowercasing
    return url.hostname.toLowerCase();
  } catch {
    // If URL parsing fails, just lowercase the hostname
    return hostname.toLowerCase();
  }
}

/**
 * Checks if a hostname matches a whitelist pattern.
 * Supports exact matches and wildcard patterns (*.example.com).
 * @param hostname - The normalized hostname to check
 * @param pattern - The whitelist pattern (e.g., "example.com" or "*.example.com")
 * @returns true if the hostname matches the pattern
 */
function matchesPattern(hostname: string, pattern: string): boolean {
  // Normalize the pattern
  const normalizedPattern = normalizeHostname(pattern);
  if (normalizedPattern.startsWith("*.")) {
    const domain = normalizedPattern.slice(2); // Remove "*."
    // Match if hostname ends with .domain or is exactly domain
    return hostname === domain || hostname.endsWith(`.${domain}`);
  }

  // Exact match
  return hostname === normalizedPattern;
}

/**
 * Validates a URL against a list of whitelisted domains with proper hostname parsing.
 * Only HTTPS URLs are allowed. Validates the hostname, not the full URL string.
 * @param url - The URL to validate
 * @param whitelistedDomains - Array of allowed domain patterns (e.g., ["ledger.com", "*.ledger.com"])
 * @returns true if the URL is valid and matches a whitelisted domain
 */
const isWhitelistedDomain = (url: string, whitelistedDomains: string[]): boolean => {
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

    // Normalize the hostname (lowercase + punycode)
    const hostname = normalizeHostname(parsedUrl.hostname);

    // Check against whitelist patterns
    const isValid = whitelistedDomains.some(pattern => matchesPattern(hostname, pattern));

    if (!isValid) {
      console.error(
        `#isWhitelistedDomain:: invalid URL: hostname '${hostname}' is not whitelisted`,
      );
    }

    return isValid;
  } catch (error) {
    // Invalid URL format
    console.error(`#isWhitelistedDomain:: invalid URL format: ${error}`);
    return false;
  }
};

export const getInitialURL = (inputs, manifest) => {
  try {
    if (inputs?.goToURL && isWhitelistedDomain(inputs?.goToURL, manifest.domains)) {
      return inputs?.goToURL;
    }

    const url = new URL(manifest.url);

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
