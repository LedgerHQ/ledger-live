import { fiat } from "../define";

export const sgd = fiat({
  type: "FiatCurrency",
  id: "sgd",
  name: "Singapore Dollar",
  ticker: "SGD",
  symbol: "S$",
  units: [{ name: "Singapore Dollar", code: "SGD", magnitude: 2 }],
  keywords: ["singapore dollar", "sgd"],
});
