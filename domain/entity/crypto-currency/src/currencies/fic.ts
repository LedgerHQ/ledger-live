import { currency } from "../define";

export const fic = currency({
  type: "CryptoCurrency",
  id: "fic",
  coinType: 5248,
  name: "FIC",
  managerAppName: "FIC",
  ticker: "FIC",
  scheme: "fic",
  color: "#5157D8",
  family: "fic",
  units: [
    {
      name: "FIC",
      code: "FIC",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
