import { currency } from "../define";

export const moonriver = currency({
  type: "CryptoCurrency",
  id: "moonriver",
  coinType: 60,
  name: "Moonriver",
  managerAppName: "Ethereum",
  ticker: "MOVR",
  scheme: "moonriver",
  color: "#95F921",
  family: "evm",
  units: [
    {
      name: "MOVR",
      code: "MOVR",
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
    chainId: 1285,
  },
  explorerViews: [
    {
      tx: "https://moonriver.moonscan.io/tx/$hash",
      address: "https://moonriver.moonscan.io/address/$address",
      token: "https://moonriver.moonscan.io/token/$contractAddress?a=$address",
    },
  ],
});
