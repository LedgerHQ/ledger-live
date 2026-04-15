import { currency } from "../define";

export const stellar = currency({
  type: "CryptoCurrency",
  id: "stellar",
  coinType: 148,
  name: "Stellar",
  managerAppName: "Stellar",
  ticker: "XLM",
  scheme: "stellar",
  color: "#000000",
  family: "stellar",
  units: [
    {
      name: "Lumen",
      code: "XLM",
      magnitude: 7,
    },
    {
      name: "stroop",
      code: "stroop",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://stellar.expert/explorer/public/tx/$hash",
    },
  ],
  keywords: ["xlm", "stellar"],
  tokenTypes: ["stellar"],
});
