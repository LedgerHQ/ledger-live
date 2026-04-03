import { currency } from "../define";

export const astar = currency({
  type: "CryptoCurrency",
  id: "astar",
  coinType: 60,
  name: "Astar",
  managerAppName: "Ethereum",
  ticker: "ASTR",
  scheme: "astar",
  color: "#06E1FF",
  family: "evm",
  units: [
    {
      name: "ASTR",
      code: "ASTR",
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
    chainId: 592,
  },
  explorerViews: [
    {
      tx: "https://astar.blockscout.com/tx/$hash",
      address: "https://astar.blockscout.com/address/$address",
      token:
        "https://astar.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
    },
  ],
});
