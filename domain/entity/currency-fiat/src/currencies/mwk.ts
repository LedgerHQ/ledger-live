import { fiat } from "../define";

export const mwk = fiat({
  type: "FiatCurrency",
  id: "mwk",
  ticker: "MWK",
  name: "Malawian Kwacha",
  symbol: "MK",
  units: [
    {
      code: "MK",
      name: "Malawian Kwacha",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
