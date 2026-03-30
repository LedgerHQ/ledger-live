import { currency } from "../define";

export const bitcoin_private = currency({
  type: "CryptoCurrency",
  id: "bitcoin_private",
  forkedFrom: "bitcoin",
  coinType: 183,
  name: "Bitcoin Private",
  managerAppName: "Bitcoin Private",
  ticker: "BTCP",
  scheme: "btcp",
  color: "#2F2D63",
  family: "bitcoin",
  blockAvgTime: 150,
  units: [
    {
      name: "bitcoin private",
      code: "BTCP",
      magnitude: 8,
    },
    {
      name: "mBTCP",
      code: "mBTCP",
      magnitude: 5,
    },
    {
      name: "bit",
      code: "bit",
      magnitude: 2,
    },
    {
      name: "satoshi",
      code: "sat",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.btcprivate.org/tx/$hash",
      address: "https://explorer.btcprivate.org/address/$address",
    },
  ],
});
