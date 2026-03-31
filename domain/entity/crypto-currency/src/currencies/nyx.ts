import { currency } from "../define";

export const nyx = currency({
  type: "CryptoCurrency",
  id: "nyx",
  coinType: 118,
  name: "Nyx",
  managerAppName: "Cosmos",
  ticker: "NYX",
  scheme: "nyx",
  color: "#5f82c8",
  family: "cosmos",
  units: [
    {
      name: "Nyx",
      code: "NYX",
      magnitude: 6,
    },
    {
      name: "Micro-Nyx",
      code: "unyx",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/nyx/txs/$hash",
      address: "https://www.mintscan.io/nyx/validators/$address",
    },
  ],
});
