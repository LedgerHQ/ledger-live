import { fiat } from "../define";

export const eur = fiat({
  type: "FiatCurrency",
  id: "eur",
  name: "Euro",
  ticker: "EUR",
  symbol: "€",
  units: [{ name: "Euro", code: "EUR", magnitude: 2 }],
  keywords: ["euro", "eur"],
});
