import { currency } from "../define";

export const elastos = currency({
  type: "CryptoCurrency",
  id: "elastos",
  coinType: 2305,
  name: "Elastos",
  managerAppName: "Elastos",
  ticker: "ELA",
  scheme: "elastos",
  color: "#000",
  family: "elastos",
  units: [
    {
      name: "ELA",
      code: "ELA",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
