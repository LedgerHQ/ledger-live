import { fiat } from "../define";

export const sek = fiat({
  type: "FiatCurrency",
  id: "sek",
  name: "Swedish Krona",
  ticker: "SEK",
  symbol: "kr",
  units: [{ name: "Swedish Krona", code: "SEK", magnitude: 2 }],
  keywords: ["krona", "sek"],
});
