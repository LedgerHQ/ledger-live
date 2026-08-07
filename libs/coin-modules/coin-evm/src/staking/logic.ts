import { ethers } from "ethers";
import type { Stake } from "@ledgerhq/coin-module-framework/api/types";
import { getStakingABI } from "./abis";
import { STAKING_CONTRACTS } from "./contracts";
import { getCoinConfig } from "../config";
import { isExternalNodeConfig } from "../network/node/types";
import { getCosmosAddr } from "./redelegations";

type RedelegationLike = { validatorDstAddress: string; completionDate: Date };

export function canUndelegate(stake: Stake, currencyId: string): boolean {
  // An activating stake is not yet in the active set, so it cannot be undelegated.
  if (stake.state === "activating") return false;
  const chainCanUndelegate = STAKING_CONTRACTS[currencyId]?.canUndelegate;
  if (chainCanUndelegate) return chainCanUndelegate(stake);
  return true;
}

/**
 * Whether a pending unbonding can be finalized via an explicit `withdraw` call.
 *
 * Only applies to chains with an explicit finalization slot (Monad carries a
 * `withdrawId`); other EVM chains auto-return funds once the unbonding period
 * elapses, so there is no withdraw CTA. The slot must also have matured — its
 * `state` advanced to `"withdrawable"`.
 */
export function canWithdraw(stake: Pick<Stake, "state" | "details">): boolean {
  return stake.state === "withdrawable" && stake.details?.withdrawId !== undefined;
}

export function canDelegate(spendableBalance: bigint): boolean {
  return spendableBalance > 0n;
}

export function canRedelegate(
  stake: Stake,
  activeRedelegations: RedelegationLike[],
  currencyId: string,
): boolean {
  // The chain must expose a redelegate precompile function; without it the
  // transaction will always fail, so the UI action should be hidden entirely.
  if (!STAKING_CONTRACTS[currencyId]?.functions.redelegate) return false;

  const maxRedelegations = STAKING_CONTRACTS[currencyId]?.maxRedelegations;
  if (maxRedelegations !== undefined && activeRedelegations.length >= maxRedelegations)
    return false;

  // Cannot redelegate FROM a validator that currently holds an active incoming
  // redelegation (21-day cooldown). Check completionDate explicitly so that
  // stale cached data does not incorrectly block redelegations after the window.
  return !activeRedelegations.some(rd => rd.validatorDstAddress === stake.delegate);
}

export function canCompound(stake: Stake, currencyId: string): boolean {
  // The chain must expose a compound precompile function; without it the
  // transaction will always fail, so the UI option should be hidden entirely.
  if (!STAKING_CONTRACTS[currencyId]?.functions.compoundReward) return false;

  // Compounding restakes accrued rewards, so it only makes sense when there is
  // something to restake.
  return (stake.amountRewarded ?? 0n) > 0n;
}

export function parseAmountStringToNumber(amountString: string, unitCode: string): string {
  return amountString.slice(amountString.lastIndexOf(",") + 1).replace(unitCode, "");
}

/**
 * Returns true when a Sei EVM account's EVM (0x) address is not yet linked
 * on-chain to its Cosmos (sei1) address. Delegation fails in this state because
 * the staking precompile routes internally through the Cosmos layer and cannot
 * resolve the Cosmos address for an unregistered EVM key.
 *
 * The link is resolved by querying the chain's address precompile (`getSeiAddr`):
 * it returns the linked Cosmos address when associated, and reverts when the
 * address has not been associated yet. We therefore treat a successful, non-empty
 * response as associated (→ false) and any failure (the revert, but also any RPC
 * error) as unassociated (→ true), so the warning is shown.
 *
 * Only applies to `sei_evm`; returns false for every other currency and when no
 * precompile / RPC node is configured.
 */
export async function isSeiAccountUnassociated(
  currencyId: string,
  freshAddress: string,
): Promise<boolean> {
  if (currencyId !== "sei_evm") return false;

  const precompile = STAKING_CONTRACTS[currencyId]?.apiConfig?.precompileAddress;
  if (!precompile) return false;

  // Resolve the RPC endpoint. A missing/non-external config means we cannot
  // determine the status, so we don't surface a warning.
  let uri: string;
  try {
    const node = getCoinConfig(currencyId).info.node;
    if (!isExternalNodeConfig(node)) return false;
    uri = node.uri;
  } catch {
    return false;
  }

  // Associated only when the precompile returns a non-empty Cosmos address.
  // `getCosmosAddr` returns `null` on revert or RPC failure, which we treat as
  // unassociated so the warning is shown.
  const cosmosAddress = await getCosmosAddr(uri, precompile, freshAddress);
  return !cosmosAddress;
}

/**
 * Decode the src/dst validator addresses from a REDELEGATE operation's
 * `contractPayload` (ABI-encoded calldata). Returns `null` when the payload is
 * absent or malformed so callers can fall back gracefully.
 */
export function decodeRedelegatePayload(
  currencyId: string,
  contractPayload: string,
): { srcValidatorAddress: string; dstValidatorAddress: string } | null {
  const config = STAKING_CONTRACTS[currencyId];
  const functionName = config?.functions.redelegate;
  const abi = getStakingABI(currencyId);
  if (!abi || !functionName) return null;
  try {
    const iface = new ethers.Interface(abi);
    const d = iface.decodeFunctionData(functionName, contractPayload);
    const [src, dst] = d;
    if (typeof src !== "string" || typeof dst !== "string") return null;
    return { srcValidatorAddress: src, dstValidatorAddress: dst };
  } catch {
    return null;
  }
}
