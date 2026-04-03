import { currency } from "../define";

export const algorand = currency({
  type: "CryptoCurrency",
  id: "algorand",
  coinType: 283,
  name: "Algorand",
  managerAppName: "Algorand",
  ticker: "ALGO",
  scheme: "algorand",
  color: "#000000",
  family: "algorand",
  units: [
    {
      name: "ALGO",
      code: "ALGO",
      magnitude: 6,
    },
    {
      name: "uALGO",
      code: "uALGO",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      tx: "https://explorer.perawallet.app/tx/$hash",
    },
  ],
  keywords: ["algo", "algorand"],
  tokenTypes: ["asa"],
});
