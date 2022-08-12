import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export default function createCryptoCurrency(family: string): CryptoCurrency {
  return {
    type: "CryptoCurrency",
    id: "testCoinId",
    coinType: 8008,
    name: "MyCoin",
    managerAppName: "MyCoin",
    ticker: "MYC",
    countervalueTicker: "MYC",
    scheme: "mycoin",
    color: "#ff0000",
    family,
    units: [
      {
        name: "MYC",
        code: "MYC",
        magnitude: 8,
      },
      {
        name: "SmallestUnit",
        code: "SMALLESTUNIT",
        magnitude: 0,
      },
    ],
    explorerViews: [
      {
        address: "https://mycoinexplorer.com/account/$address",
        tx: "https://mycoinexplorer.com/transaction/$hash",
        token: "https://mycoinexplorer.com/token/$contractAddress/?a=$address",
      },
    ],
  };
}
