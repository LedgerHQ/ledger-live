import { currency } from "../define";

export const dydx = currency({
  type: "CryptoCurrency",
  id: "dydx",
  coinType: 118,
  name: "dYdX",
  managerAppName: "Cosmos",
  ticker: "DYDX",
  scheme: "dydx",
  color: "#6666FF",
  family: "cosmos",
  units: [
    {
      name: "dYdX",
      code: "dydx",
      magnitude: 18,
    },
    {
      name: "Micro-dydx",
      code: "adydx",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/dydx/txs/$hash",
      address: "https://www.mintscan.io/dydx/validators/$address",
    },
  ],
});
