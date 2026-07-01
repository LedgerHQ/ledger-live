import { fiat } from "../define";

export const etb = fiat({
  type: "FiatCurrency",
  id: "etb",
  ticker: "ETB",
  name: "Ethiopian Birr",
  symbol: "ETB",
  units: [
    {
      code: "ETB",
      name: "Ethiopian Birr",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
