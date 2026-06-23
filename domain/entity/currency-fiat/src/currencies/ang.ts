import { fiat } from "../define";

export const ang = fiat({
  type: "FiatCurrency",
  id: "ang",
  ticker: "ANG",
  name: "Netherlands Antillean Guilder",
  symbol: "ƒ",
  units: [
    {
      code: "ƒ",
      name: "Netherlands Antillean Guilder",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
