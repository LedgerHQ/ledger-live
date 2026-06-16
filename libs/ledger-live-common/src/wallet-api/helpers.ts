import { log } from "@ledgerhq/logs";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
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
    return includes(WALLET_API_FAMILIES, getCryptoCurrencyById(currency.parentCurrencyId).family);
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
 * Validates a URL by checking it shares the manifest's registrable domain (eTLD+1)
 * and protocol. Subdomains of the manifest's domain are allowed
 * (e.g. https://cdn.example.com is accepted when the manifest is at
 * https://app.example.com), which is intentional so live apps can navigate
 * across their own subdomains. For hosts without a public suffix (localhost,
 * raw IPs, .local) the check tightens to strict same-origin (host:port + protocol),
 * preventing cross-port pivots like localhost:3000 → localhost:8080.
 *
 * Scheme must match the manifest's scheme and must be http: or https: (never
 * javascript:, data:, file:, ftp:, etc.). In production builds, only https: is
 * accepted; http: is permitted in development so http://localhost manifests
 * can be loaded.
 *
 * @param url - The URL to validate
 * @param manifestUrl - The manifest URL to compare against
 * @returns true if the URL passes the registrable-domain + protocol check
 */
const isWhitelistedDomain = (url: string, manifestUrl: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    const parsedManifestUrl = new URL(manifestUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      log(
        "wallet-api/helpers",
        `isWhitelistedDomain: invalid URL: scheme '${parsedUrl.protocol}' is not allowed`,
      );
      return false;
    }

    // Production builds only accept https. http is permitted in dev so local
    // manifests (http://localhost) can be loaded; the dead branch is stripped
    // at build time by the bundler's NODE_ENV inlining.
    if (process.env.NODE_ENV === "production" && parsedUrl.protocol !== "https:") {
      log(
        "wallet-api/helpers",
        "isWhitelistedDomain: invalid URL: only https is allowed in production",
      );
      return false;
    }

    if (parsedUrl.protocol !== parsedManifestUrl.protocol) {
      log(
        "wallet-api/helpers",
        `isWhitelistedDomain: invalid URL: scheme '${parsedUrl.protocol}' does not match manifest scheme '${parsedManifestUrl.protocol}'`,
      );
      return false;
    }

    if (!isSameDomain(url, manifestUrl)) {
      log("wallet-api/helpers", "isWhitelistedDomain: URL not on same domain as manifest");
      return false;
    }

    return true;
  } catch (error) {
    // Invalid URL format
    log("wallet-api/helpers", "isWhitelistedDomain: invalid URL format", { error: String(error) });
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
      if (manifest.params) {
        const goToURL = new URL(inputs.goToURL);
        goToURL.searchParams.set("params", JSON.stringify(manifest.params));
        return goToURL.toString();
      }
      return inputs.goToURL;
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
    if (e instanceof Error)
      log("wallet-api/helpers", "getInitialURL error", { message: e.message });

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
