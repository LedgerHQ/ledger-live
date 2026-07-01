import { fiat } from "../define";

export const aud = fiat({
  type: "FiatCurrency",
  id: "aud",
  ticker: "AUD",
  name: "Australian Dollar",
  symbol: "AU$",
  units: [
    {
      code: "AU$",
      name: "Australian Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
