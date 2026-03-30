import { currency } from "../define";

export const klaytn = currency({
  type: "CryptoCurrency",
  id: "klaytn",
  coinType: 60,
  name: "Klaytn",
  managerAppName: "Ethereum",
  ticker: "KLAY",
  scheme: "klaytn",
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
  ethereumLikeInfo: {
    chainId: 8217,
  },
  explorerViews: [
    {
      tx: "https://www.klaytnfinder.io/tx/$hash",
      address: "https://www.klaytnfinder.io/account/$address",
      token: "https://www.klaytnfinder.io/token/$address",
    },
  ],
});
