import { fiat } from "../define";

export const ttd = fiat({
  type: "FiatCurrency",
  id: "ttd",
  ticker: "TTD",
  name: "Trinidad and Tobago Dollar",
  symbol: "TT$",
  units: [
    {
      code: "TT$",
      name: "Trinidad and Tobago Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
