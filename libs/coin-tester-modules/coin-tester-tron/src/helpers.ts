import { createBridges } from "@ledgerhq/coin-tron/bridge";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { TronSigner } from "@ledgerhq/coin-tron/types";
import { TRON_MOCK_URL } from "./fixtures";

/**
 * Wires coin-tron's legacy bridge against the local java-tron node. The single
 * configurable knob is `explorer.url` — coin-tron's network layer calls
 * `coinConfig().explorer.url` for every TronGrid request. We point it at a fake
 * host (`TRON_MOCK_URL`) so MSW can intercept and the indexer can route to the
 * real local node.
 */
export function getBridges(signer: TronSigner) {
  const signerContext: SignerContext<TronSigner> = (_id, fn) => fn(signer);

  return createBridges(signerContext, () => ({
    // CurrencyConfig common fields
    status: { type: "active" },
    // TronConfig
    explorer: { url: TRON_MOCK_URL },
  }));
}
