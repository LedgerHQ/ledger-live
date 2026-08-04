import { fiat } from "../define";

export const tnd = fiat({
  type: "FiatCurrency",
  ticker: "TND",
  name: "Tunisian Dinar",
  symbol: "د.ت.‏",
  units: [
    {
      code: "د.ت.‏",
      name: "Tunisian Dinar",
      magnitude: 3,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
