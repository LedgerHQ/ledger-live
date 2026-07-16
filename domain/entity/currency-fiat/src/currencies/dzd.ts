import { fiat } from "../define";

export const dzd = fiat({
  type: "FiatCurrency",
  id: "dzd",
  ticker: "DZD",
  name: "Algerian Dinar",
  symbol: "د.ج.‏",
  units: [
    {
      code: "د.ج.‏",
      name: "Algerian Dinar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
