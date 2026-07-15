import { fiat } from "../define";

export const ils = fiat({
  type: "FiatCurrency",
  id: "ils",
  ticker: "ILS",
  name: "Israeli Shekel",
  symbol: "₪",
  units: [
    {
      code: "₪",
      name: "Israeli Shekel",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
