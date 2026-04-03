import { currency } from "../define";

export const blast = currency({
  type: "CryptoCurrency",
  id: "blast",
  coinType: 60,
  name: "Blast",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "blast",
  color: "#FCFC06",
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
  disableCountervalue: false,
  ethereumLikeInfo: {
    chainId: 81457,
  },
  explorerViews: [
    {
      tx: "https://blastscan.io/tx/$hash",
      address: "https://blastscan.io/address/$address",
      token: "https://blastscan.io/token/$contractAddress?a=$address",
    },
  ],
});
