import { fiat } from "../define";

export const azn = fiat({
  type: "FiatCurrency",
  id: "azn",
  ticker: "AZN",
  name: "Azerbaijani Manat",
  symbol: "₼",
  units: [
    {
      code: "₼",
      name: "Azerbaijani Manat",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
