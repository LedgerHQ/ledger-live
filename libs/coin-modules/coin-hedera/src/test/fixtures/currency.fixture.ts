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
    id: "hedera/hts/usd_coin_0.0.456858",
    contractAddress: "0.0.456858",
    parentCurrency: getMockedCurrency(),
    tokenType: "hts",
    name: "USD Coin",
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
    id: "hedera/hts/xpack_0.0.7243470",
    contractAddress: "0.0.7243470",
    parentCurrency: getMockedCurrency(),
    tokenType: "hts",
    name: "xPACK",
    ticker: "XPACK",
    delisted: false,
    disableCountervalue: false,
    units: [
      {
        name: "XPACK",
        code: "XPACK",
        magnitude: 6,
      },
    ],
  },
  {
    type: "TokenCurrency",
    id: "hedera/erc20/audd_0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
    contractAddress: "0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
    parentCurrency: getMockedCurrency(),
    tokenType: "erc20",
    name: "AUDD",
    ticker: "AUDD",
    delisted: false,
    disableCountervalue: false,
    units: [
      {
        name: "AUDD",
        code: "AUDD",
        magnitude: 6,
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

export const getTokenCurrencyFromCALByType = (
  type: "hts" | "erc20",
  overrides?: Partial<TokenCurrency>,
): TokenCurrency => {
  const token = HARDCODED_HEDERA_TOKENS.find(t => t.tokenType === type);

  invariant(token, `token of type ${type} not found in CAL`);

  return {
    ...token,
    ...overrides,
  };
};

export const getMockedHTSTokenCurrency = (overrides?: Partial<TokenCurrency>): TokenCurrency => {
  return {
    id: "hedera/hts/test1_0.0.1234567",
    contractAddress: "0.0.1001",
    parentCurrency: getMockedCurrency(),
    tokenType: "hts",
    name: "Test HTS token",
    ticker: "TEST1",
    type: "TokenCurrency",
    units: [
      {
        name: "Test HTS",
        code: "TEST1",
        magnitude: 8,
      },
    ],
    ...overrides,
  };
};

export const getMockedERC20TokenCurrency = (overrides?: Partial<TokenCurrency>): TokenCurrency => {
  return {
    id: "hedera/erc20/_0x915fe7c00730c08708581e30e27d9c0605be40bd",
    contractAddress: "0x915fe7c00730c08708581e30e27d9c0605be40bd",
    parentCurrency: getMockedCurrency(),
    tokenType: "erc20",
    name: "Test ERC20 token",
    ticker: "TEST2",
    type: "TokenCurrency",
    units: [
      {
        name: "Test ERC20",
        code: "TEST2",
        magnitude: 8,
      },
    ],
    ...overrides,
  };
};
