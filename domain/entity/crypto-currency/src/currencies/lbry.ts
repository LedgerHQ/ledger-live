import { currency } from "../define";

export const lbry = currency({
  type: "CryptoCurrency",
  id: "LBRY",
  coinType: 140,
  name: "LBRY",
  managerAppName: "LBRY",
  ticker: "LBRY",
  scheme: "LBRY",
  color: "#000",
  family: "bitcoin",
  units: [
    {
      name: "LBRY",
      code: "LBRY",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
