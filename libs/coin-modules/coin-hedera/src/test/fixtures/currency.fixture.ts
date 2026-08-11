import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import {
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
} from "@ledgerhq/ledger-wallet-framework/types";
import invariant from "invariant";

export const getMockedCurrency = (overrides?: Partial<CryptoCurrency>): CryptoCurrency => {
  return {
    type: "CryptoCurrency",
    id: CryptoCurrencyIdSchema.parse("hedera"),
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

const makeHederaToken = (params: {
  id: string;
  contractAddress: string;
  tokenType: "hts" | "erc20";
  name: string;
  ticker: string;
}): TokenCurrency => ({
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse(params.id),
  contractAddress: params.contractAddress,
  parentCurrencyId: CryptoCurrencyIdSchema.parse("hedera"),
  tokenType: params.tokenType,
  name: params.name,
  ticker: params.ticker,
  delisted: false,
  disableCountervalue: false,
  units: [{ name: params.ticker, code: params.ticker, magnitude: 6 }],
});

const HARDCODED_HEDERA_TOKENS: TokenCurrency[] = [
  makeHederaToken({
    id: "hedera/hts/usd_coin_0.0.456858",
    contractAddress: "0.0.456858",
    tokenType: "hts",
    name: "USD Coin",
    ticker: "USDC",
  }),
  makeHederaToken({
    id: "hedera/hts/xpack_0.0.7243470",
    contractAddress: "0.0.7243470",
    tokenType: "hts",
    name: "xPACK",
    ticker: "XPACK",
  }),
  makeHederaToken({
    id: "hedera/erc20/audd_0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
    contractAddress: "0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
    tokenType: "erc20",
    name: "AUDD",
    ticker: "AUDD",
  }),
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
    id: TokenCurrencyIdSchema.parse("hedera/hts/test1_0.0.1234567"),
    contractAddress: "0.0.1001",
    parentCurrencyId: CryptoCurrencyIdSchema.parse("hedera"),
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
    id: TokenCurrencyIdSchema.parse("hedera/erc20/_0x915fe7c00730c08708581e30e27d9c0605be40bd"),
    contractAddress: "0x915fe7c00730c08708581e30e27d9c0605be40bd",
    parentCurrencyId: CryptoCurrencyIdSchema.parse("hedera"),
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
