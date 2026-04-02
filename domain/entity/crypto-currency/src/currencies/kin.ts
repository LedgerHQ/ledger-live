import { currency } from "../define";

export const kin = currency({
  type: "CryptoCurrency",
  id: "kin",
  coinType: 2017,
  name: "Kin",
  managerAppName: "Kin",
  ticker: "KIN",
  scheme: "kin",
  color: "#0C4DD6",
  family: "stellar",
  units: [
    {
      name: "KIN",
      code: "KIN",
      magnitude: 5,
    },
  ],
  explorerViews: [
    {
      tx: "https://www.kin.org/blockchainInfoPage/?&dataType=public&header=Transaction&id=$hash",
      address:
        "https://www.kin.org/blockchainAccount/?&dataType=public&header=accountID&id=$address",
    },
  ],
});
