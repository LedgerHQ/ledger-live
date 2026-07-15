import { fiat } from "../define";

export const rub = fiat({
  type: "FiatCurrency",
  id: "rub",
  ticker: "RUB",
  name: "Russian Rouble",
  symbol: "₽",
  units: [
    {
      code: "₽",
      name: "Russian Rouble",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
