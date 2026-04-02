import { currency } from "../define";

export const akroma = currency({
  type: "CryptoCurrency",
  id: "akroma",
  coinType: 200625,
  name: "Akroma",
  managerAppName: "Akroma",
  ticker: "AKA",
  scheme: "akroma",
  color: "#AA0087",
  family: "evm",
  units: [
    {
      name: "AKA",
      code: "AKA",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://akroma.io/explorer/transaction/$hash",
    },
  ],
});
