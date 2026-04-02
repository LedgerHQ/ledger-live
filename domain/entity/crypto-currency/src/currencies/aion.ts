import { currency } from "../define";

export const aion = currency({
  type: "CryptoCurrency",
  id: "aion",
  coinType: 425,
  name: "Aion",
  managerAppName: "Aion",
  ticker: "AION",
  scheme: "aion",
  color: "#000000",
  family: "aion",
  units: [
    {
      name: "AION",
      code: "AION",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
