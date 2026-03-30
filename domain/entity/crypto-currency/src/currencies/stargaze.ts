import { currency } from "../define";

export const stargaze = currency({
  type: "CryptoCurrency",
  id: "stargaze",
  coinType: 118,
  name: "Stargaze",
  managerAppName: "Cosmos",
  ticker: "STARS",
  scheme: "stargaze",
  color: "#e38cd4",
  family: "cosmos",
  units: [
    {
      name: "Stargaze",
      code: "STARS",
      magnitude: 6,
    },
    {
      name: "Micro-Stargaze",
      code: "ustars",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/stargaze/txs/$hash",
      address: "https://www.mintscan.io/stargaze/validators/$address",
    },
  ],
});
