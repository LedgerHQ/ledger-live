import { currency } from "../define";

export const kusama = currency({
  type: "CryptoCurrency",
  id: "kusama",
  coinType: 434,
  name: "Kusama",
  managerAppName: "Kusama",
  ticker: "KSM",
  scheme: "kusama",
  color: "#000",
  family: "kusama",
  units: [
    {
      name: "KSM",
      code: "KSM",
      magnitude: 12,
    },
  ],
  explorerViews: [],
});
