import { currency } from "../define";

export const solana_devnet = currency({
  type: "CryptoCurrency",
  id: "solana_devnet",
  coinType: 501,
  name: "Solana devnet",
  managerAppName: "Solana",
  ticker: "SOL",
  scheme: "solana_devnet",
  color: "#000",
  family: "solana",
  isTestnetFor: "solana",
  disableCountervalue: true,
  units: [
    {
      name: "SOL",
      code: "𝚝SOL",
      magnitude: 9,
    },
    {
      name: "lamports",
      code: "𝚝lamports",
      magnitude: 0,
    },
  ],
  explorerViews: [
    {
      address: "https://explorer.solana.com/address/$address?cluster=devnet",
      tx: "https://explorer.solana.com/tx/$hash?cluster=devnet",
    },
    {
      address: "https://solanabeach.io/address/$address?cluster=devnet",
      tx: "https://solanabeach.io/transaction/$hash?cluster=devnet",
    },
  ],
});
