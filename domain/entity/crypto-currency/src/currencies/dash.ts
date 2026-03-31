import { currency } from "../define";

export const dash = currency({
  type: "CryptoCurrency",
  id: "dash",
  coinType: 5,
  name: "Dash",
  managerAppName: "Dash",
  ticker: "DASH",
  scheme: "dash",
  color: "#0e76aa",
  family: "bitcoin",
  blockAvgTime: 150,
  bitcoinLikeInfo: {
    P2PKH: 76,
    P2SH: 16,
    XPUBVersion: 50221816,
  },
  units: [
    {
      name: "dash",
      code: "DASH",
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
      tx: "https://explorer.dash.org/insight/tx/$hash",
      address: "https://explorer.dash.org/insight/address/$address",
    },
  ],
  explorerId: "dash",
});
