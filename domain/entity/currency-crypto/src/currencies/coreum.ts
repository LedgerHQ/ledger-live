import { currency } from "../define";

export const coreum = currency({
  type: "CryptoCurrency",
  id: "coreum",
  coinType: 118,
  name: "TX",
  managerAppName: "Cosmos",
  ticker: "TX",
  scheme: "coreum",
  color: "#6DD39A",
  family: "cosmos",
  units: [
    {
      name: "TX",
      code: "TX",
      magnitude: 6,
    },
    {
      name: "Micro-Core",
      code: "ucore",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/coreum/txs/$hash",
      address: "https://www.mintscan.io/coreum/validators/$address",
    },
  ],
});
