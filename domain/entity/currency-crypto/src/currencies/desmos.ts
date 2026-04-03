import { currency } from "../define";

export const desmos = currency({
  type: "CryptoCurrency",
  id: "desmos",
  coinType: 118,
  name: "Desmos",
  managerAppName: "Cosmos",
  ticker: "DSM",
  scheme: "desmos",
  color: "#ed6c53",
  family: "cosmos",
  units: [
    {
      name: "Desmos",
      code: "DSM",
      magnitude: 6,
    },
    {
      name: "Micro-Desmos",
      code: "udsm",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/desmos/txs/$hash",
      address: "https://www.mintscan.io/desmos/validators/$address",
    },
  ],
});
