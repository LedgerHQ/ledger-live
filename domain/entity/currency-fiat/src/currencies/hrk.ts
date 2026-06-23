import { fiat } from "../define";

export const hrk = fiat({
  type: "FiatCurrency",
  id: "hrk",
  ticker: "HRK",
  name: "Croatian Kuna",
  symbol: "kn",
  units: [
    {
      code: "kn",
      name: "Croatian Kuna",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
