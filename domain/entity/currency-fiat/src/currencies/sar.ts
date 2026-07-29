import { fiat } from "../define";

export const sar = fiat({
  type: "FiatCurrency",
  ticker: "SAR",
  name: "Saudi Riyal",
  symbol: "﷼",
  units: [
    {
      code: "﷼",
      name: "Saudi Riyal",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
