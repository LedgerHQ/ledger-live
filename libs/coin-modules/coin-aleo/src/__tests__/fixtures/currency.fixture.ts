import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

export const MOCK_TOKEN_PROGRAM_ID = "usad_stablecoin.aleo";

export const getMockedCurrency = (overrides?: Partial<CryptoCurrency>): CryptoCurrency => {
  return {
    type: "CryptoCurrency",
    id: "aleo",
    coinType: 683,
    name: "Aleo",
    managerAppName: "Aleo",
    ticker: "ALEO",
    scheme: "aleo",
    color: "#121212",
    family: "aleo",
    units: [
      {
        name: "Aleo",
        code: "ALEO",
        magnitude: 6,
      },
    ],
    explorerViews: [
      {
        tx: "https://explorer.provable.com/transaction/$hash",
        address: "https://explorer.provable.com/address/$address",
      },
    ],
    ...overrides,
  };
};

export const getMockedTokenCurrency = (overrides?: Partial<TokenCurrency>): TokenCurrency => {
  return {
    type: "TokenCurrency",
    id: "usad",
    contractAddress: MOCK_TOKEN_PROGRAM_ID,
    parentCurrencyId: "aleo",
    tokenType: "arc22",
    name: "USAD",
    ticker: "USAD",
    units: [{ name: "USAD", code: "USAD", magnitude: 6 }],
    ...overrides,
  };
};
