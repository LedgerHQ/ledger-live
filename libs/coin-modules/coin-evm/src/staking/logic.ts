import { ethers } from "ethers";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import type { Unit } from "@ledgerhq/coin-module-framework/api/types";
import { BigNumber } from "bignumber.js";
import invariant from "invariant";
import { getStakingABI } from "./abis";
import { STAKING_CONTRACTS } from "./contracts";
import { getCoinConfig } from "../config";
import { isExternalNodeConfig } from "../network/node/types";
import { getCosmosAddr } from "./redelegations";
import type {
  StakingAccount,
  StakingDelegation,
  StakingDelegationInfo,
  StakingMappedDelegation,
  StakingMappedDelegationInfo,
  StakingMappedRedelegation,
  StakingMappedUnbonding,
  StakingRedelegation,
  StakingSearchFilter,
  StakingUnbonding,
  StakingValidatorItem,
} from "@ledgerhq/types-live";
import type { Transaction } from "../types/index";

export function mapDelegations(
  delegations: StakingDelegation[],
  validators: StakingValidatorItem[],
  unit: Unit,
): StakingMappedDelegation[] {
  return delegations.map(d => {
    const rank = validators.findIndex(v => v.validatorAddress === d.validatorAddress);
    const validator = rank === -1 ? undefined : validators[rank];
    return {
      ...d,
      formattedAmount: formatCurrencyUnit(unit, d.amount, {
        disableRounding: false,
        alwaysShowSign: false,
        showCode: true,
      }),
      formattedPendingRewards: formatCurrencyUnit(unit, d.pendingRewards, {
        disableRounding: false,
        alwaysShowSign: false,
        showCode: true,
      }),
      rank,
      validator,
    };
  });
}

export function mapUnbondings(
  unbondings: StakingUnbonding[],
  validators: StakingValidatorItem[],
  unit: Unit,
): StakingMappedUnbonding[] {
  const sortedUnbondings = [...unbondings].sort(
    (a, b) => a.completionDate.valueOf() - b.completionDate.valueOf(),
  );
  return sortedUnbondings.map(u => {
    const validator = validators.find(v => v.validatorAddress === u.validatorAddress);
    return {
      ...u,
      formattedAmount: formatCurrencyUnit(unit, u.amount, {
        disableRounding: false,
        alwaysShowSign: false,
        showCode: true,
      }),
      validator,
    };
  });
}

export function mapRedelegations(
  redelegations: StakingRedelegation[],
  validators: StakingValidatorItem[],
  unit: Unit,
): StakingMappedRedelegation[] {
  return redelegations.map(r => {
    const validatorSrc = validators.find(v => v.validatorAddress === r.validatorSrcAddress);
    const validatorDst = validators.find(v => v.validatorAddress === r.validatorDstAddress);
    return {
      ...r,
      formattedAmount: formatCurrencyUnit(unit, r.amount, {
        disableRounding: false,
        alwaysShowSign: false,
        showCode: true,
      }),
      validatorSrc,
      validatorDst,
    };
  });
}

export const mapDelegationInfo = (
  delegations: StakingDelegationInfo[],
  validators: StakingValidatorItem[],
  unit: Unit,
  transaction?: Transaction,
): StakingMappedDelegationInfo[] => {
  return delegations.map(d => ({
    ...d,
    validator: validators.find(v => v.validatorAddress === d.address),
    formattedAmount: formatCurrencyUnit(unit, transaction ? transaction.amount : d.amount, {
      disableRounding: false,
      alwaysShowSign: false,
      showCode: true,
    }),
  }));
};

export const formatValue = (value: BigNumber, unit: Unit): number =>
  value
    .dividedBy(10 ** unit.magnitude)
    .integerValue(BigNumber.ROUND_FLOOR)
    .toNumber();

export const searchFilter: StakingSearchFilter =
  query =>
  ({ validator }) => {
    const terms = `${validator?.name ?? ""} ${validator?.validatorAddress ?? ""}`;
    return terms.toLowerCase().includes(query.toLowerCase().trim());
  };

export function getMaxDelegationAvailable(
  account: StakingAccount,
  _validatorsLength: number,
): BigNumber {
  const { spendableBalance } = account;
  return spendableBalance;
}

export const getMaxEstimatedBalance = (a: StakingAccount, estimatedFees: BigNumber): BigNumber => {
  const amount = a.spendableBalance.minus(estimatedFees);

  // If the fees are greater than the balance we will have a negative amount
  // so we round it to 0
  if (amount.lt(0)) {
    return new BigNumber(0);
  }

  return amount;
};

export function canUndelegate(account: StakingAccount, delegation?: StakingDelegation): boolean {
  invariant(account.stakingResources, "stakingResources should exist");
  // An activating stake is not yet in the active set, so it cannot be undelegated.
  return delegation?.status !== "activating";
}

/**
 * Whether a pending unbonding can be finalized via an explicit `withdraw` call.
 *
 * Only applies to chains with an explicit finalization slot (Monad carries a
 * `withdrawId`); other EVM chains auto-return funds once the unbonding period
 * elapses, so there is no withdraw CTA. The slot must also have matured — its
 * `status` advanced to `"withdrawable"`.
 */
export function canWithdraw(unbonding: Pick<StakingUnbonding, "withdrawId" | "status">): boolean {
  return unbonding.withdrawId !== undefined && unbonding.status === "withdrawable";
}

export function canDelegate(account: StakingAccount): boolean {
  const maxSpendableBalance = account.spendableBalance;
  return maxSpendableBalance.gt(0);
}

export function canRedelegate(
  account: StakingAccount,
  delegation: StakingDelegation | StakingValidatorItem,
): boolean {
  const { stakingResources } = account;
  invariant(stakingResources, "stakingResources should exist");

  // The chain must expose a redelegate precompile function; without it the
  // transaction will always fail, so the UI action should be hidden entirely.
  if (!STAKING_CONTRACTS[account.currency.id]?.functions.redelegate) return false;

  const redelegations = stakingResources.redelegations ?? [];
  const now = new Date();
  const maxRedelegations = STAKING_CONTRACTS[account.currency.id]?.maxRedelegations;
  const activeRedelegations = redelegations.filter(rd => rd.completionDate > now);
  if (maxRedelegations !== undefined && activeRedelegations.length >= maxRedelegations)
    return false;

  // Cannot redelegate FROM a validator that currently holds an active incoming
  // redelegation (21-day cooldown). Check completionDate explicitly so that
  // stale cached data does not incorrectly block redelegations after the window.
  return !activeRedelegations.some(rd => rd.validatorDstAddress === delegation.validatorAddress);
}

export function canCompound(account: StakingAccount, delegation: StakingDelegation): boolean {
  // The chain must expose a compound precompile function; without it the
  // transaction will always fail, so the UI option should be hidden entirely.
  if (!STAKING_CONTRACTS[account.currency.id]?.functions.compoundReward) return false;

  // Compounding restakes accrued rewards, so it only makes sense when there is
  // something to restake.
  return delegation.pendingRewards.gt(0);
}

export function getRedelegation(
  account: StakingAccount,
  delegation: StakingMappedDelegation,
): StakingRedelegation | null | undefined {
  const { stakingResources } = account;
  const redelegations = stakingResources?.redelegations ?? [];
  const now = new Date();
  return redelegations.find(
    r => r.validatorDstAddress === delegation.validatorAddress && r.completionDate > now,
  );
}

export function getRedelegationCompletionDate(
  account: StakingAccount,
  delegation: StakingMappedDelegation,
): Date | null | undefined {
  const currentRedelegation = getRedelegation(account, delegation);
  return currentRedelegation ? currentRedelegation.completionDate : null;
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
