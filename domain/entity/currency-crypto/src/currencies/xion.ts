import { currency } from "../define";

export const xion = currency({
  type: "CryptoCurrency",
  id: "xion",
  coinType: 118,
  name: "Verona",
  managerAppName: "Cosmos",
  ticker: "VERONA",
  scheme: "xion",
  color: "#000000",
  family: "cosmos",
  units: [
    {
      name: "Verona",
      code: "VERONA",
      magnitude: 6,
    },
    {
      name: "Micro-VERONA",
      code: "uxion",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/xion/txs/$hash",
      address: "https://www.mintscan.io/xion/validators/$address",
    },
  ],
});
