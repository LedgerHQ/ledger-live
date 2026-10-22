import type { SolanaCoinConfig } from "../config";

// `.invalid` hosts never resolve: a test that forgets to mock the network fails fast.
export const TEST_CONFIG: SolanaCoinConfig = {
  status: { type: "active" },
  name: "Solana",
  unit: { name: "SOL", code: "SOL", magnitude: 9 },
  token2022Enabled: false,
  legacyOCMSMaxVersion: "1.0.0",
  rpcUrls: { solana: "https://solana.test.invalid" },
};
