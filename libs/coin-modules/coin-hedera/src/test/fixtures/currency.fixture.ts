import invariant from "invariant";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const getMockedCurrency = (overrides?: Partial<CryptoCurrency>): CryptoCurrency => {
  return {
    type: "CryptoCurrency",
    id: "hedera",
    managerAppName: "Hedera",
    coinType: 3030,
    scheme: "hedera",
    color: "#000",
    family: "hedera",
    explorerViews: [
      {
        tx: "https://hashscan.io/mainnet/transaction/$hash",
        address: "https://hashscan.io/mainnet/account/$address",
      },
    ],
    name: "Hedera",
    ticker: "HBAR",
    units: [
      {
        name: "HBAR",
        code: "HBAR",
        magnitude: 8,
      },
    ],
    ...overrides,
  };
};

const HARDCODED_HEDERA_TOKENS: TokenCurrency[] = [
  {
    type: "TokenCurrency",
    id: "hedera/hts/0.0.456858",
    contractAddress: "0.0.456858",
    parentCurrency: getMockedCurrency(),
    tokenType: "hts",
    name: "USDC",
    ticker: "USDC",
    delisted: false,
    disableCountervalue: false,
    units: [
      {
        name: "USDC",
        code: "USDC",
        magnitude: 6,
      },
    ],
  },
  {
    type: "TokenCurrency",
    id: "hedera/hts/0.0.7243470",
    contractAddress: "0.0.7243470",
    parentCurrency: getMockedCurrency(),
    tokenType: "hts",
    name: "HBARX",
    ticker: "HBARX",
    delisted: false,
    disableCountervalue: false,
    units: [
      {
        name: "HBARX",
        code: "HBARX",
        magnitude: 8,
      },
    ],
  },
];

export const getTokenCurrencyFromCAL = (
  index: number,
  overrides?: Partial<TokenCurrency>,
): TokenCurrency => {
  invariant(
    index >= 0 && index < HARDCODED_HEDERA_TOKENS.length,
    `Token index ${index} out of range (available: 0-${HARDCODED_HEDERA_TOKENS.length - 1})`,
  );

  const token = HARDCODED_HEDERA_TOKENS[index];

  return {
    ...token,
    ...overrides,
  };
};

export const getMockedTokenCurrency = (overrides?: Partial<TokenCurrency>): TokenCurrency => {
  return {
    id: "hedera/hts/test_0.0.1234567",
    contractAddress: "0.0.1001",
    parentCurrency: getMockedCurrency(),
    tokenType: "hts",
    name: "Test token",
    ticker: "TEST",
    type: "TokenCurrency",
    units: [
      {
        name: "Test",
        code: "TEST",
        magnitude: 8,
      },
    ],
    ...overrides,
  };
};
