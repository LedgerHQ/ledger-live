import { currency } from "../define";

export const ravencoin = currency({
  type: "CryptoCurrency",
  id: "ravencoin",
  coinType: 175,
  name: "Ravencoin",
  managerAppName: "Ravencoin",
  ticker: "RVN",
  scheme: "ravencoin",
  color: "#000",
  family: "bitcoin",
  units: [
    {
      name: "RVN",
      code: "RVN",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
