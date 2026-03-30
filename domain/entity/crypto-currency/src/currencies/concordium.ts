import { currency } from "../define";

export const concordium = currency({
  type: "CryptoCurrency",
  id: "concordium",
  managerAppName: "Concordium",
  coinType: 919,
  name: "Concordium",
  ticker: "CCD",
  scheme: "concordium",
  color: "#000000",
  family: "concordium",
  blockAvgTime: 2,
  units: [
    {
      name: "ccd",
      code: "CCD",
      magnitude: 6,
    },
  ],
  explorerViews: [
    {
      tx: "https://ccdscan.io/transactions?dentity=transaction&dhash=$hash",
      address: "https://ccdscan.io/accounts?dentity=account&daddress=$address",
    },
  ],
  keywords: ["concordium"],
});
