import { currency } from "../define";

export const ripple = currency({
  type: "CryptoCurrency",
  id: "ripple",
  coinType: 144,
  name: "XRP",
  managerAppName: "XRP",
  ticker: "XRP",
  scheme: "ripple",
  color: "#27a2db",
  units: [
    {
      name: "XRP",
      code: "XRP",
      magnitude: 6,
    },
    {
      name: "drop",
      code: "drop",
      magnitude: 0,
    },
  ],
  family: "xrp",
  explorerViews: [
    {
      tx: "https://bithomp.com/explorer/$hash",
      address: "https://bithomp.com/explorer/$address",
    },
  ],
  keywords: ["xrp", "ripple"],
});
