import { fiat } from "../define";

export const huf = fiat({
  type: "FiatCurrency",
  id: "huf",
  ticker: "HUF",
  name: "Hungarian Forint",
  symbol: "Ft",
  units: [
    {
      code: "Ft",
      name: "Hungarian Forint",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
