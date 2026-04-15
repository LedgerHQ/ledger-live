import { currency } from "../define";

export const atheios = currency({
  type: "CryptoCurrency",
  id: "atheios",
  coinType: 1620,
  name: "Atheios",
  managerAppName: "Atheios",
  ticker: "ATH",
  scheme: "atheios",
  color: "#000000",
  family: "evm",
  units: [
    {
      name: "ATH",
      code: "ATH",
      magnitude: 8,
    },
  ],
  explorerViews: [],
});
