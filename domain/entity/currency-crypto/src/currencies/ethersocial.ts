import { currency } from "../define";

export const ethersocial = currency({
  type: "CryptoCurrency",
  id: "ethersocial",
  coinType: 61,
  name: "Ethersocial",
  managerAppName: "Ethersocial",
  ticker: "ESN",
  scheme: "ethersocial",
  color: "#000000",
  units: [
    {
      name: "ESN",
      code: "ESN",
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
  family: "evm",
  blockAvgTime: 15,
  explorerViews: [],
});
