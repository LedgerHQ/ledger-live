import { currency } from "../define";

export const ripple_testnet = currency({
  type: "CryptoCurrency",
  id: "ripple_testnet",
  coinType: 144,
  name: "XRP (Testnet)",
  managerAppName: "XRP",
  ticker: "XRP",
  scheme: "ripple_testnet",
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
  // TEMP prototype: shows the token list and its add-token button (XRPL tokens: IOU, MPT)
  tokenTypes: ["iou", "mpt"],
  isTestnetFor: "ripple",
  explorerViews: [
    {
      tx: "https://testnet.xrpl.org/transactions/$hash",
      address: "https://testnet.xrpl.org/accounts/$address",
    },
  ],
});
