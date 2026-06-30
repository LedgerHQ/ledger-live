import { currency } from "../define";

export const concordium_testnet = currency({
  type: "CryptoCurrency",
  id: "concordium_testnet",
  managerAppName: "Concordium",
  coinType: 1,
  name: "Concordium (Testnet)",
  ticker: "CCD",
  scheme: "concordium_testnet",
  color: "#000000",
  family: "concordium",
  blockAvgTime: 2,
  isTestnetFor: "concordium",
  units: [
    {
      name: "ccd",
      code: "CCD",
      magnitude: 6,
    },
  ],
  explorerViews: [
    {
      tx: "https://testnet.ccdscan.io/transactions?dentity=transaction&dhash=$hash",
      address: "https://testnet.ccdscan.io/accounts?dentity=account&daddress=$address",
    },
  ],
  keywords: ["concordium_testnet"],
});
