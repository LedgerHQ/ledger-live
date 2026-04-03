import { currency } from "../define";

export const zcoin = currency({
  type: "CryptoCurrency",
  id: "zcoin",
  coinType: 136,
  name: "ZCoin",
  managerAppName: "Zcoin",
  ticker: "XZC",
  scheme: "zcoin",
  color: "#00C027",
  family: "bitcoin",
  units: [
    {
      name: "XZC",
      code: "XZC",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.zcoin.io/tx/$hash",
    },
  ],
});
