import { fiat } from "../define";

export const jod = fiat({
  type: "FiatCurrency",
  ticker: "JOD",
  name: "Jordanian Dinar",
  symbol: "د.ا.‏",
  units: [
    {
      code: "د.ا.‏",
      name: "Jordanian Dinar",
      magnitude: 3,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
