import { fiat } from "../define";

export const cny = fiat({
  type: "FiatCurrency",
  id: "cny",
  ticker: "CNY",
  name: "Chinese Yuan Renminbi",
  symbol: "¥",
  units: [
    {
      code: "¥",
      name: "Chinese Yuan Renminbi",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
