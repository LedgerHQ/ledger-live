import { currency } from "../define";

export const stride = currency({
  type: "CryptoCurrency",
  id: "stride",
  coinType: 118,
  name: "Stride",
  managerAppName: "Cosmos",
  ticker: "STRD",
  scheme: "stride",
  color: "#e91179",
  family: "cosmos",
  units: [
    {
      name: "Stride",
      code: "STRD",
      magnitude: 6,
    },
    {
      name: "Micro-Stride",
      code: "ustrd",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/stride/txs/$hash",
      address: "https://www.mintscan.io/stride/validators/$address",
    },
  ],
});
