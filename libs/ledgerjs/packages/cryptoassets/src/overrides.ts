import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";

// FIXME: remove ERC20 overrides once CAL is fixed (solution is under discussion).
// For now, API returns wrong tokenType and is missing EVM contractAddress for these tokens.
export const HEDERA_ERC20_OVERRIDES: Record<string, Partial<TokenCurrency>> = {
  // AUDD https://hashscan.io/mainnet/contract/0.0.8317070
  "0.0.8317070": {
    contractAddress: "0x39ceba2b467fa987546000eb5d1373acf1f3a2e1",
  },
  // amUSDC https://hashscan.io/mainnet/contract/0.0.7308496
  "0.0.7308496": {
    contractAddress: "0xb7687538c7f4cad022d5e97cc778d0b46457c5db",
  },
  // WETH https://hashscan.io/mainnet/contract/0.0.9470869
  "0.0.9470869": {
    contractAddress: "0xca367694cdac8f152e33683bb36cc9d6a73f1ef2",
  },
  // WBTC https://hashscan.io/mainnet/contract/0.0.10047837
  "0.0.10047837": {
    contractAddress: "0xd7d4d91d64a6061fa00a94e2b3a2d2a5fb677849",
  },
};
