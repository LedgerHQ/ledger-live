import { currency } from "../define";

export const boba = currency({
  type: "CryptoCurrency",
  id: "boba",
  coinType: 60,
  name: "Boba",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "boba",
  color: "#CBFF00",
  family: "evm",
  units: [
    {
      name: "ETH",
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
    chainId: 288,
  },
  explorerViews: [
    {
      tx: "https://bobascan.com/tx/$hash",
      address: "https://bobascan.com/address/$address",
      token: "https://bobascan.com/token/$contractAddress?a=$address",
    },
  ],
});
