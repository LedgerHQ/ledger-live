import { fiat } from "../define";

export const all = fiat({
  type: "FiatCurrency",
  id: "all",
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
