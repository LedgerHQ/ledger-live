import { currency } from "../define";

export const persistence = currency({
  type: "CryptoCurrency",
  id: "persistence",
  coinType: 118,
  name: "Persistence",
  managerAppName: "Cosmos",
  ticker: "XPRT",
  scheme: "persistence",
  color: "#e50a13",
  family: "cosmos",
  units: [
    {
      name: "Persistence",
      code: "XPRT",
      magnitude: 6,
    },
    {
      name: "Micro-Persistence",
      code: "uxprt",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/persistence/txs/$hash",
      address: "https://www.mintscan.io/persistence/validators/$address",
    },
  ],
});
