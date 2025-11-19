import invariant from "invariant";
import { getCryptoCurrencyById, listTokensForCryptoCurrency } from "@ledgerhq/cryptoassets";
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

export const getTokenCurrencyFromCAL = (
  index: number,
  overrides?: Partial<TokenCurrency>,
): TokenCurrency => {
  const hedera = getCryptoCurrencyById("hedera");
  const token = listTokensForCryptoCurrency(hedera)[index];

  invariant(token, `token not found in CAL list on ${index} position`);

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
