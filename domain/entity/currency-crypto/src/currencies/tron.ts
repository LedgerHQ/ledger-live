import { currency } from "../define";

export const tron = currency({
  type: "CryptoCurrency",
  id: "tron",
  coinType: 195,
  name: "Tron",
  managerAppName: "Tron",
  ticker: "TRX",
  scheme: "tron",
  color: "#D9012C",
  family: "tron",
  blockAvgTime: 9,
  units: [
    {
      name: "TRX",
      code: "TRX",
      magnitude: 6,
    },
  ],
  explorerViews: [
    {
      tx: "https://tronscan.org/#/transaction/$hash",
      address: "https://tronscan.org/#/address/$address",
    },
  ],
  keywords: ["trx", "tron"],
  tokenTypes: ["trc10", "trc20"],
});
