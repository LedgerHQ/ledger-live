import { currency } from "../define";

export const kaspa = currency({
  type: "CryptoCurrency",
  id: "kaspa",
  coinType: 111111,
  name: "KASPA",
  managerAppName: "Kaspa",
  ticker: "KAS",
  scheme: "kaspa",
  color: "#70C7BA",
  family: "kaspa",
  units: [
    {
      name: "KAS",
      code: "KAS",
      magnitude: 8,
    },
    {
      name: "Sompis",
      code: "Sompi",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      address: "https://explorer.kaspa.org/addresses/$address",
      tx: "https://explorer.kaspa.org/txs/$hash",
    },
  ],
});
