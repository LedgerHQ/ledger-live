import { fiat } from "../define";

export const mkd = fiat({
  type: "FiatCurrency",
  id: "mkd",
  ticker: "MKD",
  name: "Macedonian Denar",
  symbol: "ден.",
  units: [
    {
      code: "ден.",
      name: "Macedonian Denar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
