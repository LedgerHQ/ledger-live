import { fiat } from "../define";

export const rwf = fiat({
  type: "FiatCurrency",
  id: "rwf",
  ticker: "RWF",
  name: "Rwandan Franc",
  symbol: "RWF",
  units: [
    {
      code: "RWF",
      name: "Rwandan Franc",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
