import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import { createBridges } from "@ledgerhq/coin-stacks";
import type { StacksSigner, Transaction } from "@ledgerhq/coin-stacks/types";
import type { BridgeStrategy } from "@ledgerhq/coin-tester/types";

/**
 * Builds the legacy bridge only. Unlike `coin-tester-vechain`/`coin-tester-near`, there is no
 * `strategy` branching here: `coin-stacks` on this branch has no `generic-adapter`/`CoinModuleApi`
 * path at all yet (verified — `supportedFeatures.blockchain_txs` is `["send"]` and no
 * `families/stacks` framework wiring exists), so descoping to "legacy only" isn't a reduction of
 * available coverage, it's the only strategy that exists. `createBridges` (`coin-stacks/bridge/index.ts`)
 * also takes no coin-config factory argument, unlike VeChain's/NEAR's — the endpoint is resolved
 * purely from the `API_STACKS_ENDPOINT` env var (see `src/env.setup.ts`).
 */
export function getBridges(
  strategy: BridgeStrategy,
  signer: StacksSigner,
): {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<Transaction>;
} {
  if (strategy !== "legacy") {
    throw new Error(
      `coin-tester-stacks: strategy "${strategy}" is not supported — coin-stacks has no generic-adapter path on this branch`,
    );
  }

  const context: SignerContext<StacksSigner> = (_deviceId, fn) => fn(signer);
  return createBridges(context);
}
