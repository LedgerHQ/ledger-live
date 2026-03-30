import { currency } from "../define";

export const banano = currency({
  type: "CryptoCurrency",
  id: "banano",
  coinType: 198,
  name: "Banano",
  managerAppName: "Banano",
  ticker: "BANANO",
  scheme: "banano",
  color: "#000000",
  family: "nano",
  units: [
    {
      name: "BANANO",
      code: "BANANO",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
