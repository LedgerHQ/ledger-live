import { currency } from "../define";

export const callisto = currency({
  type: "CryptoCurrency",
  id: "callisto",
  coinType: 820,
  name: "Callisto",
  managerAppName: "Callisto",
  ticker: "CLO",
  scheme: "callisto",
  color: "#000000",
  family: "evm",
  units: [
    {
      name: "CLO",
      code: "CLO",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
