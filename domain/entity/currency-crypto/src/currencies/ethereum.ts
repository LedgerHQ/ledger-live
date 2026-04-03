import { currency } from "../define";

export const ethereum = currency({
  type: "CryptoCurrency",
  id: "ethereum",
  coinType: 60,
  name: "Ethereum",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "ethereum",
  color: "#0ebdcd",
  symbol: "Ξ",
  family: "evm",
  blockAvgTime: 15,
  units: [
    {
      name: "ether",
      code: "ETH",
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
  ethereumLikeInfo: {
    chainId: 1,
  },
  explorerViews: [
    {
      tx: "https://etherscan.io/tx/$hash",
      address: "https://etherscan.io/address/$address",
      token: "https://etherscan.io/token/$contractAddress?a=$address",
    },
  ],
  keywords: ["eth", "ethereum"],
  explorerId: "eth",
  tokenTypes: ["erc20"],
});
