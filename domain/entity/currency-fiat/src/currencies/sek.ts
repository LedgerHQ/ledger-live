import { fiat } from "../define";

export const sek = fiat({
  type: "FiatCurrency",
  id: "sek",
  ticker: "SEK",
  name: "Swedish Krona",
  symbol: "kr",
  units: [
    {
      code: "kr",
      name: "Swedish Krona",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
