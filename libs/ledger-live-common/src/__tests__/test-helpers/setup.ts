import { setCryptoAssetsStore as setCryptoAssetsStoreForCoinFramework } from "@ledgerhq/coin-framework/crypto-assets/index";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { legacyCryptoAssetsStore } from "@ledgerhq/cryptoassets/legacy/legacy-store";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import "./environment";
import BigNumber from "bignumber.js";

// Initialize legacy tokens
initializeLegacyTokens(addTokens);

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

const baseVechainCurrency = {
  type: "CryptoCurrency",
  id: "vechain",
  coinType: 818,
  name: "VeChain",
  managerAppName: "VeChain",
  ticker: "VET",
  scheme: "vechain",
  color: "#82BE00",
  units: [{ name: "VET", code: "VET", magnitude: 18 }],
};

const baseMultiversXCurrency = {
  type: "CryptoCurrency",
  id: "elrond", // legacy 'multiversx' name, kept for compatibility
  coinType: 508,
  name: "MultiversX",
  managerAppName: "MultiversX",
  ticker: "EGLD",
  scheme: "elrond",
  color: "#1b46c2",
  units: [{ name: "EGLD", code: "EGLD", magnitude: 18 }],
};

// Helper to create TRC10 tokens
const createTRC10Token = (tokenId: string): TokenCurrency => ({
  type: "TokenCurrency" as const,
  id: `tron/trc10/${tokenId}`,
  contractAddress: tokenId,
  parentCurrency: baseTronCurrency as any,
  tokenType: "trc10",
  name: `Mock TRC10 Token ${tokenId}`,
  ticker: `TRC10_${tokenId}`,
  delisted: false,
  disableCountervalue: false,
  units: [{ name: `TRC10_${tokenId}`, code: `TRC10_${tokenId}`, magnitude: 6 }],
});

// Helper to create TRC20 tokens
const createTRC20Token = (address: string, name: string, ticker: string): TokenCurrency => ({
  type: "TokenCurrency" as const,
  id: `tron/trc20/${address}`,
  contractAddress: address.toUpperCase(),
  parentCurrency: baseTronCurrency as any,
  tokenType: "trc20",
  name,
  ticker,
  delisted: false,
  disableCountervalue: false,
  units: [{ name: ticker, code: ticker, magnitude: 6 }],
});

// Helper to create ASA tokens
const createASAToken = (assetId: string): TokenCurrency => ({
  type: "TokenCurrency" as const,
  id: `algorand/asa/${assetId}`,
  contractAddress: assetId,
  parentCurrency: baseAlgorandCurrency as any,
  tokenType: "asa",
  name: `Mock ASA Token ${assetId}`,
  ticker: `ASA${assetId}`,
  delisted: false,
  disableCountervalue: false,
  units: [{ name: `ASA${assetId}`, code: `ASA${assetId}`, magnitude: 6 }],
});

// Helper to create VIP180 tokens
const createVIP180Token = (
  tokenId: string,
  contractAddress: string,
  name: string,
  ticker: string,
  magnitude: number = 18,
): TokenCurrency => ({
  type: "TokenCurrency" as const,
  id: `vechain/vip180/${tokenId}`,
  contractAddress,
  parentCurrency: baseVechainCurrency as any,
  tokenType: "vip180",
  name,
  ticker,
  delisted: false,
  disableCountervalue: false,
  units: [{ name: ticker, code: ticker, magnitude }],
});

// Helper to create ESDT tokens
const createESDTToken = (
  tokenIdHex: string,
  name: string = "",
  ticker: string = "",
): TokenCurrency => {
  const tokenId = Buffer.from(tokenIdHex, "hex").toString();
  const displayName = name || `Mock ESDT ${tokenId}`;
  const displayTicker = ticker || tokenId.split("-")[0];

  return {
    type: "TokenCurrency" as const,
    id: `multiversx/esdt/${tokenIdHex}`,
    contractAddress: tokenId,
    parentCurrency: baseMultiversXCurrency as any,
    tokenType: "esdt",
    name: displayName,
    ticker: displayTicker,
    delisted: false,
    disableCountervalue: false,
    units: [{ name: displayTicker, code: displayTicker, magnitude: 18 }],
  };
};

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

  // VeChain VIP180 tokens
  "vechain/vip180/vtho": createVIP180Token(
    "vtho",
    "0x0000000000000000000000000000456E65726779",
    "VeThor Token",
    "VTHO",
    18,
  ),

  // MultiversX ESDT tokens
  "multiversx/esdt/4d45582d343535633537": createESDTToken(
    "4d45582d343535633537",
    "MEX Token",
    "MEX",
  ),
};

// Dynamic token creation for any missing tokens
const getOrCreateToken = (id: string): TokenCurrency | undefined => {
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

  if (id.startsWith("vechain/vip180/")) {
    const tokenId = id.split("/")[2];
    const token = createVIP180Token(
      tokenId,
      `0x${tokenId.padStart(40, "0")}`, // Mock contract address
      `Mock VIP180 ${tokenId.toUpperCase()}`,
      tokenId.toUpperCase(),
      18,
    );
    (mockTokens as any)[id] = token;
    return token;
  }

  if (id.startsWith("multiversx/esdt/")) {
    const tokenIdHex = id.split("/")[2];
    const token = createESDTToken(tokenIdHex);
    (mockTokens as any)[id] = token;
    return token;
  }

  return undefined;
};

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
setCryptoAssetsStoreForCoinFramework({
  findTokenById: async (id: string) => {
    // First try the legacy store
    const legacyToken = await legacyCryptoAssetsStore.findTokenById(id);
    if (legacyToken) return legacyToken;

    // Fallback to mock tokens
    return getOrCreateToken(id);
  },
  findTokenByAddressInCurrency: async (address: string, currencyId: string) => {
    // First try the legacy store
    const legacyToken = await legacyCryptoAssetsStore.findTokenByAddressInCurrency(
      address,
      currencyId,
    );
    if (legacyToken) return legacyToken;

    // Fallback to existing mock tokens
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
} as unknown as CryptoAssetsStore);
