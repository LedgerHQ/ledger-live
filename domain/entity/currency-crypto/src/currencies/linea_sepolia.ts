import { currency } from "../define";

export const linea_sepolia = currency({
  type: "CryptoCurrency",
  id: "linea_sepolia",
  coinType: 60,
  name: "Linea Sepolia",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "linea_sepolia",
  color: "#ff0000",
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
  isTestnetFor: "linea",
  ethereumLikeInfo: {
    chainId: 59141,
  },
  explorerViews: [
    {
      tx: "https://sepolia.lineascan.build/tx/$hash",
      address: "https://sepolia.lineascan.build/address/$address",
      token: "https://sepolia.lineascan.build/token/$address",
    },
  ],
});
