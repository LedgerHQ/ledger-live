import { currency } from "../define";

export const xion = currency({
  type: "CryptoCurrency",
  id: "xion",
  coinType: 118,
  name: "Xion",
  managerAppName: "Cosmos",
  ticker: "XION",
  scheme: "xion",
  color: "#000000",
  family: "cosmos",
  units: [
    {
      name: "Xion",
      code: "XION",
      magnitude: 6,
    },
    {
      name: "Micro-XION",
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
