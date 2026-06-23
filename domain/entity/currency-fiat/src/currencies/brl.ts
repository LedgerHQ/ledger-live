import { fiat } from "../define";

export const brl = fiat({
  type: "FiatCurrency",
  id: "brl",
  ticker: "BRL",
  name: "Brazilian Real",
  symbol: "R$",
  units: [
    {
      code: "R$",
      name: "Brazilian Real",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
