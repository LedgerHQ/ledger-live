import { currency } from "../define";

export const solana_testnet = currency({
  type: "CryptoCurrency",
  id: "solana_testnet",
  coinType: 501,
  name: "Solana testnet",
  managerAppName: "Solana",
  ticker: "SOL",
  scheme: "solana_testnet",
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
      address: "https://explorer.solana.com/address/$address?cluster=testnet",
      tx: "https://explorer.solana.com/tx/$hash?cluster=testnet",
    },
    {
      address: "https://solanabeach.io/address/$address?cluster=testnet",
      tx: "https://solanabeach.io/transaction/$hash?cluster=testnet",
    },
  ],
});
