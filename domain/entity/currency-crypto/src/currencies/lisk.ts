import { currency } from "../define";

export const lisk = currency({
  type: "CryptoCurrency",
  id: "lisk",
  coinType: 134,
  name: "lisk",
  managerAppName: "Lisk",
  ticker: "LSK",
  scheme: "lisk",
  color: "#16213D",
  family: "lisk",
  units: [
    {
      name: "LSK",
      code: "LSK",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
