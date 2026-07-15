import { fiat } from "../define";

export const nok = fiat({
  type: "FiatCurrency",
  id: "nok",
  ticker: "NOK",
  name: "Norwegian Krone",
  symbol: "kr",
  units: [
    {
      code: "kr",
      name: "Norwegian Krone",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
