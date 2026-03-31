import { currency } from "../define";

export const aeternity = currency({
  type: "CryptoCurrency",
  id: "aeternity",
  coinType: 457,
  name: "æternity",
  managerAppName: "Aeternity",
  ticker: "AE",
  scheme: "aeternity",
  color: "#f7296e",
  family: "aeternity",
  units: [
    {
      name: "AE",
      code: "AE",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.aepps.com/#/tx/$hash",
    },
  ],
});
