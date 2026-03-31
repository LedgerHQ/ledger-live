import { currency } from "../define";

export const nos = currency({
  type: "CryptoCurrency",
  id: "nos",
  name: "NOS",
  coinType: 229,
  managerAppName: "NOS",
  ticker: "NOS",
  scheme: "nos",
  color: "#2B92D3",
  family: "nano",
  units: [
    {
      name: "NOS",
      code: "NOS",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
