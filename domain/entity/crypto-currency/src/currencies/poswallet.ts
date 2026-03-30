import { currency } from "../define";

export const poswallet = currency({
  type: "CryptoCurrency",
  id: "poswallet",
  coinType: 47,
  name: "PosW",
  managerAppName: "PoSW",
  ticker: "POSW",
  scheme: "posw",
  color: "#000000",
  family: "bitcoin",
  blockAvgTime: 60,
  bitcoinLikeInfo: {
    P2PKH: 55,
    P2SH: 85,
    XPUBVersion: 76067358,
  },
  units: [
    {
      name: "posw",
      code: "POSW",
      magnitude: 8,
    },
    {
      name: "satoshi",
      code: "sat",
      magnitude: 0,
    },
  ],
  explorerViews: [],
  terminated: {
    link: "https://support.ledger.com/hc/en-us/articles/115005175309",
  },
  explorerId: "posw",
});
