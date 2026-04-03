import { currency } from "../define";

export const wanchain = currency({
  type: "CryptoCurrency",
  id: "wanchain",
  coinType: 5718350,
  name: "Wanchain",
  managerAppName: "Wanchain",
  ticker: "WAN",
  scheme: "wanchain",
  color: "#276097",
  family: "evm",
  units: [
    {
      name: "WAN",
      code: "WAN",
      magnitude: 8,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.wanchain.org/block/trans/$hash",
    },
  ],
});
