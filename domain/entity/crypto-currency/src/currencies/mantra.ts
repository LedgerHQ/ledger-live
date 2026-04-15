import { currency } from "../define";

export const mantra = currency({
  type: "CryptoCurrency",
  id: "mantra",
  coinType: 118,
  name: "Mantra",
  managerAppName: "Cosmos",
  ticker: "MANTRA",
  scheme: "mantra",
  color: "#ffb386",
  family: "cosmos",
  units: [
    {
      name: "Mantra",
      code: "MANTRA",
      magnitude: 18,
    },
    {
      name: "Micro-Mantra",
      code: "amantra",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/mantra/txs/$hash",
      address: "https://www.mintscan.io/mantra/validators/$address",
    },
  ],
});
