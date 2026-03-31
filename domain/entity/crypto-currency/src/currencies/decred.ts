import { currency } from "../define";

export const decred = currency({
  type: "CryptoCurrency",
  id: "decred",
  coinType: 42,
  name: "Decred",
  managerAppName: "Decred",
  ticker: "DCR",
  scheme: "decred",
  color: "#2f74fb",
  units: [
    {
      name: "decred",
      code: "DCR",
      magnitude: 8,
    },
    {
      name: "milli-decred",
      code: "mDCR",
      magnitude: 5,
    },
    {
      name: "satoshi",
      code: "sat",
      magnitude: 0,
    },
  ],
  family: "bitcoin",
  blockAvgTime: 900,
  bitcoinLikeInfo: {
    P2PKH: 1855,
    P2SH: 1818,
    XPUBVersion: 50178342,
  },
  explorerViews: [
    {
      tx: "https://mainnet.decred.org/tx/$hash",
      address: "https://mainnet.decred.org/address/$address",
    },
  ],
  explorerId: "dcr",
});
