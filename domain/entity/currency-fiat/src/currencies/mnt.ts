import { fiat } from "../define";

export const mnt = fiat({
  type: "FiatCurrency",
  id: "mnt",
  ticker: "MNT",
  name: "Mongolian Tugrik",
  symbol: "₮",
  units: [
    {
      code: "₮",
      name: "Mongolian Tugrik",
      magnitude: 2,
      showAllDigits: true,
      prefixCode: true,
    },
  ],
});
