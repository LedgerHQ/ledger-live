import { currency } from "../define";

export const neo = currency({
  type: "CryptoCurrency",
  id: "neo",
  coinType: 888,
  name: "Neo",
  managerAppName: "NEO",
  ticker: "NEO",
  scheme: "neo",
  color: "#09C300",
  family: "neo",
  units: [
    {
      name: "NEO",
      code: "NEO",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://neotracker.io/tx/$hash",
    },
  ],
});
