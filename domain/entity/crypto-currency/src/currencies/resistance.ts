import { currency } from "../define";

export const resistance = currency({
  type: "CryptoCurrency",
  id: "resistance",
  coinType: 356,
  name: "Resistance",
  managerAppName: "Resistance",
  ticker: "RES",
  scheme: "resistance",
  color: "#000",
  family: "bitcoin",
  units: [
    {
      name: "RES",
      code: "RES",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
