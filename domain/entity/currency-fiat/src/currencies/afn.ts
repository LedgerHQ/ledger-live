import { fiat } from "../define";

export const afn = fiat({
  type: "FiatCurrency",
  ticker: "AFN",
  name: "Afghan Afghani",
  symbol: "؋",
  units: [
    {
      code: "؋",
      name: "Afghan Afghani",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
