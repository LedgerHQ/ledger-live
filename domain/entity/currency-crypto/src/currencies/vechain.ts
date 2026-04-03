import { currency } from "../define";

export const vechain = currency({
  type: "CryptoCurrency",
  id: "vechain",
  coinType: 818,
  name: "Vechain",
  managerAppName: "VeChain",
  ticker: "VET",
  scheme: "vechain",
  color: "#82BE00",
  family: "vechain",
  blockAvgTime: 10,
  units: [
    {
      name: "VET",
      code: "VET",
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
      tx: "https://explore.vechain.org/transactions/$hash",
      address: "https://explore.vechain.org/accounts/$address",
    },
  ],
  tokenTypes: ["vip180"],
});
