import { currency } from "../define";

export const bitcoin_cash = currency({
  type: "CryptoCurrency",
  id: "bitcoin_cash",
  forkedFrom: "bitcoin",
  coinType: 145,
  name: "Bitcoin Cash",
  managerAppName: "Bitcoin Cash",
  ticker: "BCH",
  scheme: "bitcoincash",
  color: "#3ca569",
  family: "bitcoin",
  blockAvgTime: 900,
  bitcoinLikeInfo: {
    P2PKH: 0,
    P2SH: 5,
    XPUBVersion: 76067358,
  },
  units: [
    {
      name: "bitcoin cash",
      code: "BCH",
      magnitude: 8,
    },
    {
      name: "mBCH",
      code: "mBCH",
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
      tx: "https://blockchair.com/bitcoin-cash/transaction/$hash",
      address: "https://blockchair.com/bitcoin-cash/address/$address",
    },
  ],
  explorerId: "bch",
});
