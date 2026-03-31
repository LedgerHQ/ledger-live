import { currency } from "../define";

export const somnia = currency({
  type: "CryptoCurrency",
  id: "somnia",
  coinType: 60,
  name: "Somnia",
  managerAppName: "Ethereum",
  ticker: "SOMI",
  scheme: "somnia",
  color: "#6F0191",
  family: "evm",
  units: [
    {
      name: "SOMI",
      code: "SOMI",
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
    chainId: 5031,
  },
  explorerViews: [
    {
      tx: "https://explorer.somnia.network/tx/$hash",
      address: "https://explorer.somnia.network/address/$address",
    },
  ],
});
