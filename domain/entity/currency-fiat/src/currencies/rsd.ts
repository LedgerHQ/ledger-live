import { fiat } from "../define";

export const rsd = fiat({
  type: "FiatCurrency",
  id: "rsd",
  ticker: "RSD",
  name: "Serbian Dinar",
  symbol: "Дин.",
  units: [
    {
      code: "Дин.",
      name: "Serbian Dinar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
