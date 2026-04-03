import { currency } from "../define";

export const elrond = currency({
  type: "CryptoCurrency",
  id: "elrond",
  coinType: 508,
  name: "MultiversX",
  managerAppName: "MultiversX",
  ticker: "EGLD",
  scheme: "multiversx",
  color: "#23F7DD",
  family: "multiversx",
  blockAvgTime: 6,
  deviceTicker: "EGLD",
  units: [
    {
      name: "EGLD",
      code: "EGLD",
      magnitude: 18,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.multiversx.com/transactions/$hash",
      address: "https://explorer.multiversx.com/accounts/$address",
    },
  ],
  keywords: ["multiversx"],
  tokenTypes: ["esdt"],
});
