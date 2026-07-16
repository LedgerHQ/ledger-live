import { fiat } from "../define";

export const gel = fiat({
  type: "FiatCurrency",
  id: "gel",
  ticker: "GEL",
  name: "Georgian Lari",
  symbol: "GEL",
  units: [
    {
      code: "GEL",
      name: "Georgian Lari",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
