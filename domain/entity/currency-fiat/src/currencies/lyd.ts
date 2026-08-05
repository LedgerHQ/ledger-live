import { fiat } from "../define";

export const lyd = fiat({
  type: "FiatCurrency",
  ticker: "LYD",
  name: "Libyan Dinar",
  symbol: "د.ل.‏",
  units: [
    {
      code: "د.ل.‏",
      name: "Libyan Dinar",
      magnitude: 3,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
