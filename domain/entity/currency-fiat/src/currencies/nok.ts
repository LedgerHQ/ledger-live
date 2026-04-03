import { fiat } from "../define";

export const nok = fiat({
  type: "FiatCurrency",
  id: "nok",
  name: "Norwegian Krone",
  ticker: "NOK",
  symbol: "kr",
  units: [{ name: "Norwegian Krone", code: "NOK", magnitude: 2 }],
  keywords: ["krone", "nok"],
});
