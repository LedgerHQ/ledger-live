import { currency } from "../define";

export const klaytn_baobab = currency({
  type: "CryptoCurrency",
  id: "klaytn_baobab",
  coinType: 60,
  name: "Klaytn Baobab",
  managerAppName: "Ethereum",
  ticker: "KLAY",
  scheme: "klaytn_baobab",
  color: "#FF8B00",
  family: "evm",
  units: [
    {
      name: "KLAY",
      code: "KLAY",
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
  isTestnetFor: "klaytn",
  ethereumLikeInfo: {
    chainId: 1001,
  },
  explorerViews: [
    {
      tx: "https://baobab.klaytnfinder.io/tx/$hash",
      address: "https://baobab.klaytnfinder.io/account/$address",
      token: "https://baobab.klaytnfinder.io/token/$address",
    },
  ],
});
