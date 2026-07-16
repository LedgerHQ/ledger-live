import { fiat } from "../define";

export const idr = fiat({
  type: "FiatCurrency",
  id: "idr",
  ticker: "IDR",
  name: "Indonesian Rupiah",
  symbol: "Rp",
  units: [
    {
      code: "Rp",
      name: "Indonesian Rupiah",
      magnitude: 0,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
