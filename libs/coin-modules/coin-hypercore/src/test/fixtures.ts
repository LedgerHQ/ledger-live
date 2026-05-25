import type { HyperCoreCoinConfig } from "../config";

export function createMockCoinConfigValue(): HyperCoreCoinConfig {
  return {
    status: { type: "active" },
    infoUrl: "https://api.hyperliquid.xyz/info",
  };
}
