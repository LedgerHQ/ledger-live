import { fiat } from "../define";

export const all = fiat({
  type: "FiatCurrency",
  ticker: "ALL",
  name: "Albanian Lek",
  symbol: "Lek",
  units: [
    {
      code: "Lek",
      name: "Albanian Lek",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
