import { currency } from "../define";

export const polygon_amoy = currency({
  type: "CryptoCurrency",
  id: "polygon_amoy",
  coinType: 60,
  name: "Polygon Amoy",
  managerAppName: "Ethereum",
  ticker: "POL",
  deviceTicker: "POL",
  scheme: "polygon_amoy",
  color: "#6d29de",
  family: "evm",
  isTestnetFor: "polygon",
  disableCountervalue: true,
  ethereumLikeInfo: {
    chainId: 80002,
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
      tx: "https://amoy.polygonscan.com/tx/$hash",
      address: "https://amoy.polygonscan.com/address/$address",
      token: "https://amoy.polygonscan.com/token/$contractAddress?a=$address",
    },
  ],
  explorerId: "matic_amoy",
});
