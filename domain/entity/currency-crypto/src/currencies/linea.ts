import { currency } from "../define";

export const linea = currency({
  type: "CryptoCurrency",
  id: "linea",
  coinType: 60,
  name: "Linea",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "linea",
  color: "#000000",
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
    chainId: 59144,
  },
  explorerViews: [
    {
      tx: "https://lineascan.build/tx/$hash",
      address: "https://lineascan.build/address/$address",
      token: "https://lineascan.build/token/$address",
    },
  ],
});
