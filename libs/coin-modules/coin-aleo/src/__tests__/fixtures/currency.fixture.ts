import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

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
