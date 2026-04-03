import { currency } from "../define";

export const blast_sepolia = currency({
  type: "CryptoCurrency",
  id: "blast_sepolia",
  coinType: 60,
  name: "Blast Sepolia",
  managerAppName: "Ethereum",
  ticker: "ETH",
  scheme: "blast_sepolia",
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
  isTestnetFor: "blast",
  ethereumLikeInfo: {
    chainId: 168587773,
  },
  explorerViews: [
    {
      tx: "https://sepolia.blastscan.io/tx/$hash",
      address: "https://sepolia.blastscan.io/address/$address",
      token: "https://sepolia.blastscan.io/token/$contractAddress?a=$address",
    },
  ],
});
