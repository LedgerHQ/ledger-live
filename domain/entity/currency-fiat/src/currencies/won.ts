import { fiat } from "../define";

export const won = fiat({
  type: "FiatCurrency",
  id: "won",
  ticker: "WON",
  name: "North Korean Won",
  symbol: "₩",
  units: [
    {
      code: "₩",
      name: "North Korean Won",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
