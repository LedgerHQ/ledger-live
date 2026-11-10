import { currency } from "../define";

export const alpen = currency({
  type: "CryptoCurrency",
  id: "alpen",
  coinType: 60,
  name: "Alpen",
  managerAppName: "Ethereum",
  ticker: "BTC",
  scheme: "alpen",
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
  explorerViews: [
    {
      tx: "https://explorer.himalayan-java-8qh3wg.alpen.org/tx/$hash",
      address: "https://explorer.himalayan-java-8qh3wg.alpen.org/address/$address",
      token: "https://explorer.himalayan-java-8qh3wg.alpen.org/token/$contractAddress?a=$address",
    },
  ],
});
