import { fiat } from "../define";

export const php = fiat({
  type: "FiatCurrency",
  id: "php",
  ticker: "PHP",
  name: "Philippine Peso",
  symbol: "₱",
  units: [
    {
      code: "₱",
      name: "Philippine Peso",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
