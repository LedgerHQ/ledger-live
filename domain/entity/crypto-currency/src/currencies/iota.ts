import { currency } from "../define";

export const iota = currency({
  type: "CryptoCurrency",
  id: "iota",
  coinType: 4218,
  name: "IOTA",
  managerAppName: "IOTA",
  ticker: "IOTA",
  scheme: "iota",
  color: "#000000",
  family: "iota",
  units: [
    {
      name: "IOTA",
      code: "IOTA",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
