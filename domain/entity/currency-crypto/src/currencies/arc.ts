import { currency } from "../define";

export const arc = currency({
  type: "CryptoCurrency",
  id: "arc",
  coinType: 60,
  name: "Arc",
  managerAppName: "Ethereum",
  ticker: "USDC",
  deviceTicker: "USDC",
  scheme: "arc",
  color: "#1A2B5F",
  family: "evm",
  units: [
    {
      name: "USDC",
      code: "USDC",
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
    chainId: 5042,
  },
  explorerViews: [
    {
      tx: "https://explorer.arc.io/tx/$hash",
      address: "https://explorer.arc.io/address/$address",
      token: "https://explorer.arc.io/token/$contractAddress?a=$address",
    },
  ],
});
