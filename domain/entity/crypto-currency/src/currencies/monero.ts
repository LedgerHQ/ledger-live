import { currency } from "../define";

export const monero = currency({
  type: "CryptoCurrency",
  id: "monero",
  coinType: 128,
  name: "Monero",
  managerAppName: "Monero",
  ticker: "XMR",
  scheme: "monero",
  color: "#FF5900",
  family: "monero",
  units: [
    {
      name: "XMR",
      code: "XMR",
      magnitude: 12,
    },
  ],
  explorerViews: [
    {
      tx: "https://moneroblocks.info/tx/$hash",
    },
  ],
  keywords: ["xmr", "monero"],
});
