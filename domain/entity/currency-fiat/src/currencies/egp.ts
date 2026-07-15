import { fiat } from "../define";

export const egp = fiat({
  type: "FiatCurrency",
  id: "egp",
  ticker: "EGP",
  name: "Egyptian Pound",
  symbol: "ج.م.‏",
  units: [
    {
      code: "ج.م.‏",
      name: "Egyptian Pound",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
