import { currency } from "../define";

export const tomo = currency({
  type: "CryptoCurrency",
  id: "tomo",
  coinType: 889,
  name: "TomoChain",
  managerAppName: "TomoChain",
  ticker: "TOMO",
  scheme: "tomo",
  color: "#FF9933",
  family: "evm",
  blockAvgTime: 2,
  units: [
    {
      name: "TOMO",
      code: "TOMO",
      magnitude: 18,
    },
  ],
  explorerViews: [
    {
      tx: "https://scan.tomochain.com/txs/$hash",
    },
  ],
});
