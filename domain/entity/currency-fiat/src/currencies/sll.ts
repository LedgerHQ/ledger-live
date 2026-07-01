import { fiat } from "../define";

export const sll = fiat({
  type: "FiatCurrency",
  id: "sll",
  ticker: "SLL",
  name: "Sierra Leonean Leone",
  symbol: "Le",
  units: [
    {
      code: "Le",
      name: "Sierra Leonean Leone",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
