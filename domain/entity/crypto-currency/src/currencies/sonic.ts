import { currency } from "../define";

export const sonic = currency({
  type: "CryptoCurrency",
  id: "sonic",
  coinType: 60,
  name: "Sonic",
  managerAppName: "Sonic",
  ticker: "S",
  scheme: "sonic",
  color: "#FFFFFF",
  family: "evm",
  units: [
    {
      name: "S",
      code: "S",
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
    chainId: 146,
  },
  explorerViews: [
    {
      tx: "https://sonicscan.org/tx/$hash",
      address: "https://sonicscan.org/address/$address",
      token: "https://sonicscan.org/token/$contractAddress?a=$address",
    },
  ],
  tokenTypes: ["erc20"],
});
