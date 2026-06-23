import { fiat } from "../define";

export const bif = fiat({
  type: "FiatCurrency",
  id: "bif",
  ticker: "BIF",
  name: "Burundian Franc",
  symbol: "FBu",
  units: [
    {
      code: "FBu",
      name: "Burundian Franc",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
