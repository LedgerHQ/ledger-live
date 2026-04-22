import { currency } from "../define";

export const zcash = currency({
  type: "CryptoCurrency",
  id: "zcash",
  coinType: 133,
  name: "Zcash",
  managerAppName: "Zcash",
  ticker: "ZEC",
  scheme: "zcash",
  color: "#3790ca",
  family: "bitcoin",
  blockAvgTime: 150,
  bitcoinLikeInfo: {
    P2PKH: 7352,
    P2SH: 7357,
    XPUBVersion: 76067358,
  },
  units: [
    {
      name: "zcash",
      code: "ZEC",
      magnitude: 8,
    },
    {
      name: "satoshi",
      code: "sat",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://blockchair.com/zcash/transaction/$hash",
      address: "https://blockchair.com/zcash/address/$address",
    },
  ],
  explorerId: "zec",
});
