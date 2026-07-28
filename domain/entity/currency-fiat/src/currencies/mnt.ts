import { fiat } from "../define";

export const mnt = fiat({
  type: "FiatCurrency",
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
