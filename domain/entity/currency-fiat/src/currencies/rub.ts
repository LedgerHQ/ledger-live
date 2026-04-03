import { fiat } from "../define";

export const rub = fiat({
  type: "FiatCurrency",
  id: "rub",
  name: "Russian Ruble",
  ticker: "RUB",
  symbol: "₽",
  units: [{ name: "Russian Ruble", code: "RUB", magnitude: 2 }],
  keywords: ["ruble", "rub"],
});
