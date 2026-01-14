import buildCoinConfig, { type CoinConfig } from "@ledgerhq/coin-framework/config";
import { getEnv } from "@ledgerhq/live-env";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { ConcordiumCoinConfig } from "./types/config";

export type { ConcordiumCoinConfig };

/**
 * Use software signer for testing/development instead of hardware device
 * Set to true to use mock signer from concordiumTestUtils.ts
 * Default: false (use hardware signer)
 * Can be configured via CONCORDIUM_USE_SOFTWARE_SIGNER environment variable
 */
export const CONCORDIUM_USE_SOFTWARE_SIGNER = (() => {
  const mockMode = getEnv("MOCK");
  if (!mockMode) {
    return false;
  }

  return getEnv("CONCORDIUM_USE_SOFTWARE_SIGNER") || false;
})();

const coinConfig: {
  setCoinConfig: (config: CoinConfig<ConcordiumCoinConfig>) => void;
  getCoinConfig: (currency?: CryptoCurrency) => ConcordiumCoinConfig;
} = buildCoinConfig<ConcordiumCoinConfig>();

export default coinConfig;
