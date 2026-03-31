import { currency } from "../define";

export const ethereum_sepolia = currency({
  type: "CryptoCurrency",
  id: "ethereum_sepolia",
  coinType: 60,
  name: "Ethereum Sepolia",
  managerAppName: "Ethereum",
  ticker: "ETH",
  deviceTicker: "ETH",
  scheme: "eth_sepolia",
  color: "#ff0000",
  units: [
    {
      name: "ether",
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
  isTestnetFor: "ethereum",
  disableCountervalue: true,
  family: "evm",
  blockAvgTime: 15,
  ethereumLikeInfo: {
    chainId: 11155111,
  },
  explorerViews: [
    {
      tx: "https://sepolia.etherscan.io/tx/$hash",
      address: "https://sepolia.etherscan.io/address/$address",
    },
  ],
  explorerId: "eth_sepolia",
});
