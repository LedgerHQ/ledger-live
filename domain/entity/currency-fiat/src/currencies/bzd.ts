import { fiat } from "../define";

export const bzd = fiat({
  type: "FiatCurrency",
  id: "bzd",
  ticker: "BZD",
  name: "Belize Dollar",
  symbol: "BZ$",
  units: [
    {
      code: "BZ$",
      name: "Belize Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
