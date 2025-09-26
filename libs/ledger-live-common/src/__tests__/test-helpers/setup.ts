import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import "./environment";
import BigNumber from "bignumber.js";

jest.setTimeout(360000);

expect.extend({
  toBeBigNumber(value) {
    const pass = BigNumber.isBigNumber(value);
    const message = pass ? () => `${value} is a BigNumber` : () => `${value} is not a BigNumber`;

    return { message, pass };
  },
});

// Mock tokens for integration tests
const baseTronCurrency = {
  type: "CryptoCurrency",
  id: "tron",
  coinType: 195,
  name: "Tron",
  managerAppName: "Tron",
  ticker: "TRX",
  scheme: "tron",
  color: "#ff060a",
  units: [
    { name: "TRX", code: "TRX", magnitude: 6 },
    { name: "SUN", code: "SUN", magnitude: 0 },
  ],
};

const baseAlgorandCurrency = {
  type: "CryptoCurrency",
  id: "algorand",
  coinType: 283,
  name: "Algorand",
  managerAppName: "Algorand",
  ticker: "ALGO",
  scheme: "algorand",
  color: "#1CBFBC",
  units: [{ name: "ALGO", code: "ALGO", magnitude: 6 }],
};

// Helper to create TRC10 tokens
const createTRC10Token = (tokenId: string) => ({
  type: "TokenCurrency",
  id: `tron/trc10/${tokenId}`,
  contractAddress: tokenId,
  parentCurrency: baseTronCurrency,
  tokenType: "trc10",
  name: `Mock TRC10 Token ${tokenId}`,
  ticker: `TRC10_${tokenId}`,
  delisted: false,
  disableCountervalue: false,
  units: [{ name: `TRC10_${tokenId}`, code: `TRC10_${tokenId}`, magnitude: 6 }],
});

// Helper to create TRC20 tokens
const createTRC20Token = (address: string, name: string, ticker: string) => ({
  type: "TokenCurrency",
  id: `tron/trc20/${address}`,
  contractAddress: address.toUpperCase(),
  parentCurrency: baseTronCurrency,
  tokenType: "trc20",
  name,
  ticker,
  delisted: false,
  disableCountervalue: false,
  units: [{ name: ticker, code: ticker, magnitude: 6 }],
});

// Helper to create ASA tokens
const createASAToken = (assetId: string) => ({
  type: "TokenCurrency",
  id: `algorand/asa/${assetId}`,
  contractAddress: assetId,
  parentCurrency: baseAlgorandCurrency,
  tokenType: "asa",
  name: `Mock ASA Token ${assetId}`,
  ticker: `ASA${assetId}`,
  delisted: false,
  disableCountervalue: false,
  units: [{ name: `ASA${assetId}`, code: `ASA${assetId}`, magnitude: 6 }],
});

// Mock tokens registry
const mockTokens = {
  // TRON TRC10 tokens (from snapshots)
  "tron/trc10/1002775": createTRC10Token("1002775"),
  "tron/trc10/1002830": createTRC10Token("1002830"),
  "tron/trc10/1002398": createTRC10Token("1002398"),
  "tron/trc10/1002573": createTRC10Token("1002573"),
  "tron/trc10/1002736": createTRC10Token("1002736"),
  "tron/trc10/1002814": createTRC10Token("1002814"),
  "tron/trc10/1002000": createTRC10Token("1002000"),
  "tron/trc10/1002544": createTRC10Token("1002544"),
  "tron/trc10/1000226": createTRC10Token("1000226"),
  "tron/trc10/1002672": createTRC10Token("1002672"),
  "tron/trc10/1002597": createTRC10Token("1002597"),
  "tron/trc10/1002517": createTRC10Token("1002517"),
  "tron/trc10/1002578": createTRC10Token("1002578"),
  "tron/trc10/1002798": createTRC10Token("1002798"),

  // TRON TRC20 tokens (from snapshots and datasets)
  "tron/trc20/tla2f6vpqdgre67v1736s7bj8ray5wyju7": createTRC20Token(
    "tla2f6vpqdgre67v1736s7bj8ray5wyju7",
    "Mock TRC20 Token",
    "MOCK",
  ),
  "tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t": createTRC20Token(
    "tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t",
    "Mock USDT Token",
    "USDT",
  ),

  // Algorand ASA tokens
  "algorand/asa/312769": createASAToken("312769"),
  "algorand/asa/31231": createASAToken("31231"),
};

// Dynamic token creation for any missing tokens
const getOrCreateToken = (id: string) => {
  // Return if already in cache
  if (mockTokens[id as keyof typeof mockTokens]) {
    return mockTokens[id as keyof typeof mockTokens];
  }

  // Create token dynamically based on ID pattern
  if (id.startsWith("tron/trc10/")) {
    const tokenId = id.split("/")[2];
    const token = createTRC10Token(tokenId);
    (mockTokens as any)[id] = token;
    return token;
  }

  if (id.startsWith("tron/trc20/")) {
    const address = id.split("/")[2];
    const token = createTRC20Token(
      address,
      `Mock TRC20 ${address}`,
      `TRC20_${address.substring(0, 6).toUpperCase()}`,
    );
    (mockTokens as any)[id] = token;
    return token;
  }

  if (id.startsWith("algorand/asa/")) {
    const assetId = id.split("/")[2];
    const token = createASAToken(assetId);
    (mockTokens as any)[id] = token;
    return token;
  }

  return undefined;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStoreForCoinFramework({
  findTokenById: async (id: string) => {
    return getOrCreateToken(id);
  },
  findTokenByAddressInCurrency: async (address: string, currencyId: string) => {
    // First try to find in existing tokens
    const existingToken = Object.values(mockTokens).find(
      token => token.contractAddress === address && token.parentCurrency.id === currencyId,
    );
    if (existingToken) return existingToken;

    // Create dynamically based on currency
    if (currencyId === "tron") {
      // Check if it's a TRC10 (numeric) or TRC20 (hex string)
      const isTRC10 = /^\d+$/.test(address);
      const tokenType = isTRC10 ? "trc10" : "trc20";
      const id = `tron/${tokenType}/${address.toLowerCase()}`;
      return getOrCreateToken(id);
    }

    if (currencyId === "algorand") {
      const id = `algorand/asa/${address}`;
      return getOrCreateToken(id);
    }

    return undefined;
  },
} as CryptoAssetsStore);
