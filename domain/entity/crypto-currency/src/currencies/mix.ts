import { currency } from "../define";

export const mix = currency({
  type: "CryptoCurrency",
  id: "mix",
  coinType: 76,
  name: "MIX Blockchain",
  managerAppName: "Mix",
  ticker: "MIX",
  scheme: "mix",
  color: "#00C4DF",
  family: "evm",
  units: [
    {
      name: "MIX",
      code: "MIX",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
