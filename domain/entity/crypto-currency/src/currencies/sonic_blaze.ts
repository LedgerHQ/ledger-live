import { currency } from "../define";

export const sonic_blaze = currency({
  type: "CryptoCurrency",
  id: "sonic_blaze",
  isTestnetFor: "sonic",
  coinType: 60,
  name: "Sonic Blaze",
  managerAppName: "Sonic",
  ticker: "S",
  scheme: "sonic_blaze",
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
    chainId: 57054,
  },
  explorerViews: [
    {
      tx: "https://testnet.sonicscan.org/tx/$hash",
      address: "https://testnet.sonicscan.org/address/$address",
      token: "https://testnet.sonicscan.org/token/$contractAddress?a=$address",
    },
  ],
});
