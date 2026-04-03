import { currency } from "../define";

export const umee = currency({
  type: "CryptoCurrency",
  id: "umee",
  coinType: 118,
  name: "Umee",
  managerAppName: "Cosmos",
  ticker: "UMEE",
  scheme: "umee",
  color: "#bb90f8",
  family: "cosmos",
  units: [
    {
      name: "Umee",
      code: "UMEE",
      magnitude: 6,
    },
    {
      name: "Micro-Umee",
      code: "uumee",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/umee/txs/$hash",
      address: "https://www.mintscan.io/umee/validators/$address",
    },
  ],
});
