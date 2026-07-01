import { fiat } from "../define";

export const cve = fiat({
  type: "FiatCurrency",
  id: "cve",
  ticker: "CVE",
  name: "Cape Verdean Escudo",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Cape Verdean Escudo",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
