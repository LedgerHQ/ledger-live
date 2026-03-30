import { currency } from "../define";

export const factom = currency({
  type: "CryptoCurrency",
  id: "factom",
  coinType: 131,
  name: "Factom",
  managerAppName: "Factom",
  ticker: "FCT",
  scheme: "factom",
  color: "#2F2879",
  family: "factom",
  units: [
    {
      name: "FCT",
      code: "FCT",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
