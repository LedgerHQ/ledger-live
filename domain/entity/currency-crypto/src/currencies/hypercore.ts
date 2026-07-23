import { currency } from "../define";

export const hypercore = currency({
  type: "CryptoCurrency",
  id: "hypercore",
  coinType: 60,
  name: "Hyperliquid (HyperCore)",
  managerAppName: "Ethereum",
  ticker: "USDC",
  scheme: "hypercore",
  color: "#97FCE4",
  family: "hypercore",
  units: [
    {
      name: "USD Coin",
      code: "USDC",
      magnitude: 6,
    },
  ],
  explorerViews: [
    {
      tx: "https://app.hyperliquid.xyz/explorer/tx/$hash",
      address: "https://app.hyperliquid.xyz/explorer/address/$address",
    },
  ],
  keywords: ["usdc", "hype", "hyperliquid", "hypercore"],
});
