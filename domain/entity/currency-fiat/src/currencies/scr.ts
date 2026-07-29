import { fiat } from "../define";

export const scr = fiat({
  type: "FiatCurrency",
  ticker: "SCR",
  name: "Seychellois Rupee",
  symbol: "₨",
  units: [
    {
      code: "₨",
      name: "Seychellois Rupee",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
