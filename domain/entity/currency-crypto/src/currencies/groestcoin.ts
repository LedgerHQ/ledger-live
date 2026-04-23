import { currency } from "../define";

export const groestcoin = currency({
  type: "CryptoCurrency",
  id: "groestcoin",
  coinType: 17,
  name: "Groestlcoin",
  managerAppName: "Groestlcoin",
  ticker: "GRS",
  scheme: "groestcoin",
  color: "#0299C0",
  family: "groestcoin",
  blockAvgTime: 60,
  units: [
    {
      name: "GRS",
      code: "GRS",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://chainz.cryptoid.info/grs/tx.dws?$hash.htm",
    },
  ],
});
