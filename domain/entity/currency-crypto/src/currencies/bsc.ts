import { currency } from "../define";

export const bsc = currency({
  type: "CryptoCurrency",
  id: "bsc",
  coinType: 60,
  name: "BNB Chain",
  managerAppName: "Ethereum",
  ticker: "BNB",
  scheme: "bsc",
  color: "#F0B90A",
  family: "evm",
  ethereumLikeInfo: {
    chainId: 56,
  },
  units: [
    {
      name: "BNB",
      code: "BNB",
      magnitude: 18,
    },
    {
      name: "Gwei",
      code: "Gwei",
      magnitude: 9,
    },
    {
      name: "Mwei",
      code: "Mwei",
      magnitude: 6,
    },
    {
      name: "Kwei",
      code: "Kwei",
      magnitude: 3,
    },
    {
      name: "wei",
      code: "wei",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://bscscan.com/tx/$hash",
      address: "https://bscscan.com/address/$address",
      token: "https://bscscan.com/token/$contractAddress?a=$address",
    },
  ],
  keywords: ["bsc", "bnb", "binance", "binance smart chain", "binance chain"],
  explorerId: "bnb",
  tokenTypes: ["bep20"],
});
