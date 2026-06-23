import { fiat } from "../define";

export const xpf = fiat({
  type: "FiatCurrency",
  id: "xpf",
  ticker: "XPF",
  name: "CFP Franc",
  symbol: "F",
  units: [
    {
      code: "F",
      name: "CFP Franc",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
