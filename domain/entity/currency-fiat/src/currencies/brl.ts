import { fiat } from "../define";

export const brl = fiat({
  type: "FiatCurrency",
  id: "brl",
  name: "Brazilian Real",
  ticker: "BRL",
  symbol: "R$",
  units: [{ name: "Brazilian Real", code: "BRL", magnitude: 2 }],
  keywords: ["real", "brl"],
});
