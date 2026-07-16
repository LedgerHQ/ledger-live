import { fiat } from "../define";

export const kwd = fiat({
  type: "FiatCurrency",
  id: "kwd",
  ticker: "KWD",
  name: "Kuwaiti Dinar",
  symbol: "د.ك.‏",
  units: [
    {
      code: "د.ك.‏",
      name: "Kuwaiti Dinar",
      magnitude: 3,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
