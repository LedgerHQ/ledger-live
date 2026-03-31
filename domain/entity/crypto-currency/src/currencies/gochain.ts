import { currency } from "../define";

export const gochain = currency({
  type: "CryptoCurrency",
  id: "gochain",
  coinType: 6060,
  name: "GoChain",
  managerAppName: "GoChain",
  ticker: "GO",
  scheme: "gochain",
  color: "#000000",
  family: "evm",
  units: [
    {
      name: "GO",
      code: "GO",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
