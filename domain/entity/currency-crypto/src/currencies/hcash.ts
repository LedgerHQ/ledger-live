import { currency } from "../define";

export const hcash = currency({
  type: "CryptoCurrency",
  id: "hcash",
  coinType: 171,
  name: "Hcash",
  managerAppName: "HCash",
  ticker: "HSR",
  scheme: "hcash",
  color: "#56438c",
  family: "bitcoin",
  blockAvgTime: 150,
  bitcoinLikeInfo: {
    P2PKH: 40,
    P2SH: 100,
    XPUBVersion: 76071454,
  },
  units: [
    {
      name: "hcash",
      code: "HSR",
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
    link: "https://support.ledger.com/hc/en-us/articles/115003917133",
  },
  explorerId: "hsr",
});
