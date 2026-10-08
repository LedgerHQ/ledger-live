import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { encodeSubOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Operation } from "@ledgerhq/types-live";
import type { StacksTxData } from "@ledgerhq/coin-stacks/types";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { defaultGetTokenFromAssetByAddress } from "../../../bridge/generic-coin-framework/utils";

/**
 * Stacks SIP-010 tokens are keyed in the registry by the same composite
 * `"ADDRESS.CONTRACT::ASSET"` string `coin-stacks`'s `getBalance`/`listOperations` already
 * populate `assetReference` with (matching the legacy bridge's `network/transformers.ts`), so no
 * extra parsing is needed here -- this is a plain string passthrough that happens to work for any
 * number of tokens, same address-keyed strategy as VeChain's single VTHO lookup.
 */
export const getTokenFromAsset = defaultGetTokenFromAssetByAddress;

export function getAssetFromToken(token: TokenCurrency, owner: string): AssetInfo {
  return {
    type: "token",
    // NOT lowercased, deliberately: unlike `getBalance`/`listOperations`'s own composite string
    // (used only as a matchable identifier), this `assetReference` is also split back into a real
    // on-chain contract address by `buildUnsignedTx.ts`'s `parseSip010AssetReference` when crafting
    // an actual transfer -- a Stacks c32 address is only valid in its canonical case (decoding
    // requires the literal "S" prefix), so lowercasing it here would break every real send. Callers
    // that only need to *match* this reference against `getBalance`'s lowercased one compare
    // case-insensitively instead (`resolveAmount`, `validateIntent`'s `spendable`, `buildSubAccounts`,
    // `getAccountShape`'s vanished-token detection).
    assetReference: token.contractAddress,
    assetOwner: owner,
    name: token.name,
    unit: token.units[0],
  };
}

/**
 * `StakingTransactionIntent` has no generic field for pox-5's `numCycles`/`startBurnHt` (a lock
 * duration and eligibility height with no equivalent in any other chain's staking model) --
 * `GenericTransaction.familySpecificData` (ADR-047) is exactly the escape hatch for this: carried
 * verbatim from the transaction into `StacksTxData` here, then read back by
 * `buildUnsignedTx.ts`'s `buildStaking` for the `delegate` branch. `undelegate` needs neither
 * field (`buildStaking` resolves the existing stake's signer-manager itself), so an absent/partial
 * `familySpecificData` is fine there.
 */
export function buildIntentData(transaction: Record<string, unknown>): StacksTxData {
  const familySpecificData = transaction.familySpecificData as Record<string, unknown> | undefined;
  const numCycles = familySpecificData?.numCycles;
  const startBurnHt = familySpecificData?.startBurnHt;
  const signerCalldata = familySpecificData?.signerCalldata;

  return {
    type: "stacks-pox",
    numCycles: typeof numCycles === "number" ? numCycles : undefined,
    startBurnHt: typeof startBurnHt === "number" ? startBurnHt : undefined,
    signerCalldata: typeof signerCalldata === "string" ? signerCalldata : undefined,
  };
}

/**
 * `coin-stacks` reports each send-many recipient as an `internal` operation, but the framework keys
 * an operation by hash and type, so every recipient would share the batch's id, and it adds the fee
 * to each outgoing native value as if each were a transaction of its own. Restore the legacy
 * bridge's shape: one sub-operation id per recipient, holding only that recipient's amount.
 */
function isInternal(op: Operation): boolean {
  const { extra } = op;
  return (
    typeof extra === "object" && extra !== null && "internal" in extra && extra.internal === true
  );
}

export function adaptOperations(_address: string, operations: Operation[]): Operation[] {
  const internalIndexByHash: Record<string, number> = {};

  return operations.map(op => {
    if (!isInternal(op)) return op;

    const index = internalIndexByHash[op.hash] ?? 0;
    internalIndexByHash[op.hash] = index + 1;
    return {
      ...op,
      id: encodeSubOperationId(op.accountId, op.hash, op.type, index),
      value: op.value.minus(op.fee),
      contract: "send-many",
    };
  });
}

export default function stacksBridge(currency: CryptoCurrency): BridgeApi {
  return {
    getTokenFromAsset: (asset: AssetInfo) => getTokenFromAsset(currency, asset),
    getAssetFromToken: (token: TokenCurrency, owner: string) => getAssetFromToken(token, owner),
    buildIntentData,
    adaptOperations,
    usesStakingPositions: true,
    // The legacy bridge keyed account ids on the public key; keep them so the switch re-keys nothing.
    accountIdFromPublicKey: true,
  };
}
