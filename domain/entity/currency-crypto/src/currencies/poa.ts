import { currency } from "../define";

export const poa = currency({
  type: "CryptoCurrency",
  id: "poa",
  coinType: 178,
  name: "POA",
  managerAppName: "POA",
  ticker: "POA",
  scheme: "poa",
  color: "#4D46BD",
  family: "evm",
  units: [
    {
      name: "POA",
      code: "POA",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://poaexplorer.com/tx/$hash",
    },
  ],
});
