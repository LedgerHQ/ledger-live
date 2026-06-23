import { fiat } from "../define";

export const qar = fiat({
  type: "FiatCurrency",
  id: "qar",
  ticker: "QAR",
  name: "Qatari Riyal",
  symbol: "﷼",
  units: [
    {
      code: "﷼",
      name: "Qatari Riyal",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
