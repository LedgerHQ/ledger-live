import { fiat } from "../define";

export const kpw = fiat({
  type: "FiatCurrency",
  id: "kpw",
  ticker: "KPW",
  name: "North Korean Won",
  symbol: "₩",
  units: [
    {
      code: "₩",
      name: "North Korean Won",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
