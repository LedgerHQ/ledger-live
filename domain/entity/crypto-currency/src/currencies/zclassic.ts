import { currency } from "../define";

export const zclassic = currency({
  type: "CryptoCurrency",
  id: "zclassic",
  coinType: 147,
  name: "ZClassic",
  managerAppName: "ZClassic",
  ticker: "ZCL",
  scheme: "zclassic",
  color: "#CF6031",
  family: "bitcoin",
  blockAvgTime: 150,
  bitcoinLikeInfo: {
    P2PKH: 7352,
    P2SH: 7357,
  },
  units: [
    {
      name: "zclassic",
      code: "ZCL",
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
      tx: "https://zcl.tokenview.com/en/tx/$hash",
      address: "https://zcl.tokenview.com/en/address/$address",
    },
  ],
});
