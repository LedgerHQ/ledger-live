import { currency } from "../define";

export const ubiq = currency({
  type: "CryptoCurrency",
  id: "ubiq",
  coinType: 108,
  name: "Ubiq",
  managerAppName: "Ubiq",
  ticker: "UBQ",
  scheme: "ubiq",
  color: "#02e785",
  family: "evm",
  blockAvgTime: 88,
  units: [
    {
      name: "ubiq",
      code: "UBQ",
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
      tx: "https://ubiqscan.io/tx/$hash",
    },
  ],
});
