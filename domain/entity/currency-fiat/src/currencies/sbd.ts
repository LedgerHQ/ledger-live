import { fiat } from "../define";

export const sbd = fiat({
  type: "FiatCurrency",
  id: "sbd",
  ticker: "SBD",
  name: "Solomon Islands Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Solomon Islands Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
