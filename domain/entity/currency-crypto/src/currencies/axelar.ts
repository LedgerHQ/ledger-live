import { currency } from "../define";

export const axelar = currency({
  type: "CryptoCurrency",
  id: "axelar",
  coinType: 118,
  name: "Axelar",
  managerAppName: "Cosmos",
  ticker: "AXL",
  scheme: "axelar",
  color: "#b2b6bc",
  family: "cosmos",
  units: [
    {
      name: "Axelar",
      code: "AXL",
      magnitude: 6,
    },
    {
      name: "Micro-Axelar",
      code: "uaxl",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/axelar/txs/$hash",
      address: "https://www.mintscan.io/axelar/validators/$address",
    },
  ],
});
