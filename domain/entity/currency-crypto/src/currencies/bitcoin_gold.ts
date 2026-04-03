import { currency } from "../define";

export const bitcoin_gold = currency({
  type: "CryptoCurrency",
  id: "bitcoin_gold",
  forkedFrom: "bitcoin",
  coinType: 156,
  name: "Bitcoin Gold",
  managerAppName: "Bitcoin Gold",
  ticker: "BTG",
  scheme: "btg",
  color: "#132c47",
  supportsSegwit: true,
  family: "bitcoin",
  blockAvgTime: 900,
  bitcoinLikeInfo: {
    P2PKH: 38,
    P2SH: 23,
    XPUBVersion: 76067358,
  },
  units: [
    {
      name: "bitcoin gold",
      code: "BTG",
      magnitude: 8,
    },
    {
      name: "mBTG",
      code: "mBTG",
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
      tx: "https://btgexplorer.com/tx/$hash",
      address: "https://btgexplorer.com/address/$address",
    },
  ],
  explorerId: "btg",
});
