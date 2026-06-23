import { fiat } from "../define";

export const lsl = fiat({
  type: "FiatCurrency",
  id: "lsl",
  ticker: "LSL",
  name: "Lesotho Loti",
  symbol: "M",
  units: [
    {
      code: "M",
      name: "Lesotho Loti",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
