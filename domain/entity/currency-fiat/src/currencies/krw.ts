import { fiat } from "../define";

export const krw = fiat({
  type: "FiatCurrency",
  id: "krw",
  name: "South Korean Won",
  ticker: "KRW",
  symbol: "₩",
  units: [{ name: "South Korean Won", code: "KRW", magnitude: 0 }],
  keywords: ["won", "krw"],
});
