import { currency } from "../define";

export const qtum = currency({
  type: "CryptoCurrency",
  id: "qtum",
  coinType: 88,
  name: "Qtum",
  managerAppName: "Qtum",
  supportsSegwit: true,
  ticker: "QTUM",
  scheme: "qtum",
  color: "#2e9ad0",
  family: "bitcoin",
  blockAvgTime: 120,
  bitcoinLikeInfo: {
    P2PKH: 58,
    P2SH: 50,
    XPUBVersion: 76067358,
  },
  units: [
    {
      name: "qtum",
      code: "QTUM",
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
      tx: "https://explorer.qtum.org/tx/$hash",
      address: "https://explorer.qtum.org/address/$address",
    },
  ],
  explorerId: "qtum",
});
