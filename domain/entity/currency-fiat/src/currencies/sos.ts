import { fiat } from "../define";

export const sos = fiat({
  type: "FiatCurrency",
  id: "sos",
  ticker: "SOS",
  name: "Somali Shilling",
  symbol: "S",
  units: [
    {
      code: "S",
      name: "Somali Shilling",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
