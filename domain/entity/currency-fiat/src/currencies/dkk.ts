import { fiat } from "../define";

export const dkk = fiat({
  type: "FiatCurrency",
  id: "dkk",
  name: "Danish Krone",
  ticker: "DKK",
  symbol: "kr",
  units: [{ name: "Danish Krone", code: "DKK", magnitude: 2 }],
  keywords: ["krone", "dkk"],
});
