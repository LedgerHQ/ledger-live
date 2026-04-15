import { currency } from "../define";

export const solana = currency({
  type: "CryptoCurrency",
  id: "solana",
  coinType: 501,
  name: "Solana",
  managerAppName: "Solana",
  ticker: "SOL",
  scheme: "solana",
  color: "#000",
  family: "solana",
  units: [
    {
      name: "SOL",
      code: "SOL",
      magnitude: 9,
    },
    {
      name: "lamports",
      code: "lamports",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      address: "https://explorer.solana.com/address/$address",
      tx: "https://explorer.solana.com/tx/$hash",
    },
    {
      address: "https://solanabeach.io/address/$address",
      tx: "https://solanabeach.io/transaction/$hash",
    },
  ],
  keywords: ["sol", "solana"],
  tokenTypes: ["spl"],
});
