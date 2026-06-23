import { fiat } from "../define";

export const czk = fiat({
  type: "FiatCurrency",
  id: "czk",
  ticker: "CZK",
  name: "Czech Koruna",
  symbol: "Kč",
  units: [
    {
      code: "Kč",
      name: "Czech Koruna",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
