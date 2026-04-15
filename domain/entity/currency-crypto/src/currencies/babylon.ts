import { currency } from "../define";

export const babylon = currency({
  type: "CryptoCurrency",
  id: "babylon",
  coinType: 118,
  name: "Babylon",
  managerAppName: "Cosmos",
  ticker: "BABY",
  scheme: "babylon",
  color: "#CE6533",
  family: "cosmos",
  units: [
    {
      name: "Babylon",
      code: "BABY",
      magnitude: 6,
    },
    {
      name: "micro BBN",
      code: "ubbn",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.mintscan.io/babylon/txs/$hash",
      address: "https://www.mintscan.io/babylon/validators/$address",
    },
  ],
});
