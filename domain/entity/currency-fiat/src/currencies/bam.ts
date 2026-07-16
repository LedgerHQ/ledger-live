import { fiat } from "../define";

export const bam = fiat({
  type: "FiatCurrency",
  id: "bam",
  ticker: "BAM",
  name: "Bosnia-Herzegovina Convertible Mark",
  symbol: "КМ",
  units: [
    {
      code: "КМ",
      name: "Bosnia-Herzegovina Convertible Mark",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
