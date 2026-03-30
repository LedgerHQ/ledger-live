import { currency } from "../define";

export const polygon = currency({
  type: "CryptoCurrency",
  id: "polygon",
  coinType: 60,
  name: "Polygon",
  managerAppName: "Ethereum",
  ticker: "POL",
  scheme: "polygon",
  color: "#6d29de",
  family: "evm",
  ethereumLikeInfo: {
    chainId: 137,
  },
  units: [
    {
      name: "POL",
      code: "POL",
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
      tx: "https://polygonscan.com/tx/$hash",
      address: "https://polygonscan.com/address/$address",
      token: "https://polygonscan.com/token/$contractAddress?a=$address",
    },
  ],
  keywords: ["matic", "polygon"],
  explorerId: "matic",
  tokenTypes: ["erc20"],
});
