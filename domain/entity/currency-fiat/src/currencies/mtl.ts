import { fiat } from "../define";

export const mtl = fiat({
  type: "FiatCurrency",
  id: "mtl",
  ticker: "MTL",
  name: "Maltese Lira",
  symbol: "₤",
  units: [
    {
      code: "₤",
      name: "Maltese Lira",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
