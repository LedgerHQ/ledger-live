import { currency } from "../define";

export const nimiq = currency({
  type: "CryptoCurrency",
  id: "nimiq",
  coinType: 242,
  name: "Nimiq",
  managerAppName: "Nimiq",
  ticker: "NIM",
  scheme: "nimiq",
  color: "#FFBE00",
  family: "nimiq",
  units: [
    {
      name: "NIM",
      code: "NIM",
      magnitude: 5,
    },
  ],
  explorerViews: [
    {
      tx: "https://nimiq.watch/#$hash",
    },
  ],
});
