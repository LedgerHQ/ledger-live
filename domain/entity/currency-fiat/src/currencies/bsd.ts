import { fiat } from "../define";

export const bsd = fiat({
  type: "FiatCurrency",
  id: "bsd",
  ticker: "BSD",
  name: "Bahamian Dollar",
  symbol: "$",
  units: [
    {
      code: "$",
      name: "Bahamian Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
