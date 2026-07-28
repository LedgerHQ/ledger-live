import { currency } from "../define";

export const hypercore = currency({
  type: "CryptoCurrency",
  id: "hypercore",
  coinType: 60,
  name: "Hyperliquid",
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
      // Address view only (no HyperCore tx hash exposed by the proxy).
      address: "https://app.hyperliquid.xyz/explorer/address/$address",
    },
  ],
  keywords: ["usdc", "hype", "hyperliquid", "hypercore"],
});
