import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import type { ConcordiumCurrencyBridge } from "@ledgerhq/coin-concordium";
import type { CurrencyBridge } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

function isConcordiumCurrencyBridge(bridge: CurrencyBridge): bridge is ConcordiumCurrencyBridge {
  return (
    "onboardAccount" in bridge &&
    typeof bridge.onboardAccount === "function" &&
    "pairWalletConnect" in bridge &&
    typeof bridge.pairWalletConnect === "function"
  );
}

export function getConcordiumBridge(currency: CryptoCurrency): ConcordiumCurrencyBridge {
  const bridge = getCurrencyBridge(currency);
  if (!isConcordiumCurrencyBridge(bridge)) {
    throw new Error(`Expected ConcordiumCurrencyBridge for ${currency.id}`);
  }
  return bridge;
}
