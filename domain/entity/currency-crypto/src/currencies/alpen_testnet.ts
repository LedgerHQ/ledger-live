import { currency } from "../define";

export const alpen_testnet = currency({
  type: "CryptoCurrency",
  id: "alpen_testnet",
  coinType: 60,
  name: "Alpen Testnet",
  managerAppName: "Ethereum",
  ticker: "BTC",
  scheme: "alpen_testnet",
  color: "#F68B1F",
  family: "evm",
  units: [
    {
      name: "BTC",
      code: "BTC",
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
  isTestnetFor: "alpen",
  explorerViews: [
    {
      tx: "https://explorer.testnet.alpen.org/tx/$hash",
      address: "https://explorer.testnet.alpen.org/address/$address",
      token: "https://explorer.testnet.alpen.org/token/$contractAddress?a=$address",
    },
  ],
});
