import { currency } from "../define";

export const flow = currency({
  type: "CryptoCurrency",
  id: "flow",
  coinType: 539,
  name: "Flow",
  managerAppName: "Flow",
  ticker: "FLOW",
  scheme: "flow",
  color: "#000",
  family: "flow",
  units: [
    {
      name: "FLOW",
      code: "FLOW",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
