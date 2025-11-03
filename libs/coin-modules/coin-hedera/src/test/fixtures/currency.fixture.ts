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

export const getTokenCurrencyFromCALByIndex = (
  index: number,
  overrides?: Partial<TokenCurrency>,
): TokenCurrency => {
  const hedera = getCryptoCurrencyById("hedera");
  const token = listTokensForCryptoCurrency(hedera)[index];

  invariant(token, `token not found in CAL on ${index} position`);

  return {
    ...token,
    ...overrides,
  };
};

export const getTokenCurrencyFromCALByType = (
  type: "hts" | "erc20",
  overrides?: Partial<TokenCurrency>,
): TokenCurrency => {
  const hedera = getCryptoCurrencyById("hedera");
  const token = listTokensForCryptoCurrency(hedera).find(t => t.tokenType === type);

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
