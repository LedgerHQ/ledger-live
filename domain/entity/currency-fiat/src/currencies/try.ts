import { fiat } from "../define";

export const try_ = fiat({
  type: "FiatCurrency",
  id: "try",
  ticker: "TRY",
  name: "Turkish Lira",
  symbol: "₺",
  units: [
    {
      code: "₺",
      name: "Turkish Lira",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
