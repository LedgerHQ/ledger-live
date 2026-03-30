import { currency } from "../define";

export const story = currency({
  type: "CryptoCurrency",
  id: "story",
  coinType: 60,
  name: "Story",
  managerAppName: "Ethereum",
  ticker: "IP",
  scheme: "story",
  color: "#6366F1",
  family: "evm",
  units: [
    {
      name: "IP",
      code: "IP",
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
    chainId: 1514,
  },
  explorerViews: [
    {
      tx: "https://www.storyscan.io/tx/$hash",
      address: "https://www.storyscan.io/address/$address",
      token: "https://www.storyscan.io/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
