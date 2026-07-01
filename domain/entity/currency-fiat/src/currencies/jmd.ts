import { fiat } from "../define";

export const jmd = fiat({
  type: "FiatCurrency",
  id: "jmd",
  ticker: "JMD",
  name: "Jamaican Dollar",
  symbol: "J$",
  units: [
    {
      code: "J$",
      name: "Jamaican Dollar",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
