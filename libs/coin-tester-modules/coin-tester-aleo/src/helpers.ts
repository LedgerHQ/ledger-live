import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { createBridges } from "@ledgerhq/coin-aleo/bridge/index";
import type { AleoCoinConfig, AleoSigner } from "@ledgerhq/coin-aleo/types";

/**
 * `createBridges` also calls `aleoCoinConfig.setCoinConfig`, which is the single
 * source both resolveConfig and prepareTransaction read. Nothing else needs to
 * be configured.
 */
export function getBridges(signer: AleoSigner, config: AleoCoinConfig) {
  const signerContext: SignerContext<AleoSigner> = (_, fn) => fn(signer);
  return createBridges(signerContext, () => config);
}
