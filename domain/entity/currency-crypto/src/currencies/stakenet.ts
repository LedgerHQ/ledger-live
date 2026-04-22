import { currency } from "../define";

export const stakenet = currency({
  type: "CryptoCurrency",
  id: "stakenet",
  coinType: 384,
  name: "Stakenet",
  managerAppName: "XSN",
  ticker: "XSN",
  scheme: "xsn",
  terminated: {
    link: "https://support.ledger.com/",
  },
  color: "#141828",
  supportsSegwit: true,
  family: "bitcoin",
  blockAvgTime: 60,
  bitcoinLikeInfo: {
    P2PKH: 76,
    P2SH: 16,
    XPUBVersion: 76067358,
  },
  units: [
    {
      name: "xsn",
      code: "XSN",
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
      tx: "https://xsnexplorer.io/transactions/$hash",
      address: "https://xsnexplorer.io/addresses/$address",
    },
  ],
});
