import { fiat } from "../define";

export const myr = fiat({
  type: "FiatCurrency",
  id: "myr",
  ticker: "MYR",
  name: "Malaysian Ringgit",
  symbol: "RM",
  units: [
    {
      code: "RM",
      name: "Malaysian Ringgit",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
