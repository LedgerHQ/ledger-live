import { fiat } from "../define";

export const ron = fiat({
  type: "FiatCurrency",
  id: "ron",
  ticker: "RON",
  name: "Romanian Leu",
  symbol: "L",
  units: [
    {
      code: "L",
      name: "Romanian Leu",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
