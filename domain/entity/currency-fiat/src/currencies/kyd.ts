import { fiat } from "../define";

export const kyd = fiat({
  type: "FiatCurrency",
  id: "kyd",
  ticker: "KYD",
  name: "Cayman Islands Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Cayman Islands Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
