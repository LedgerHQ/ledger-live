import { fiat } from "../define";

export const gtq = fiat({
  type: "FiatCurrency",
  id: "gtq",
  ticker: "GTQ",
  name: "Guatemalan Quetzal",
  symbol: "Q",
  units: [
    {
      code: "Q",
      name: "Guatemalan Quetzal",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
