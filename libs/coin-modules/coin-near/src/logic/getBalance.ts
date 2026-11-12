import type { AssetInfo, Balance, BalanceOptions } from "@ledgerhq/coin-module-framework/api/index";
import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";
import type { NearContext } from "../config";
import { getAccount } from "../network";
import { toStakes } from "./getStakes";

export const NATIVE_ASSET: AssetInfo = { type: "native" };

/**
 * Native balance plus one entry per staking position.
 *
 * The native entry comes first on purpose: the generic coin-framework picks the account balance
 * from the *first* native entry, and the staking entries are also native.
 *
 * Its value is the account total, delegated buckets included, which is what the account bridge
 * reports as the account balance. `locked` is the non-spendable part of it: the staked, pending
 * and withdrawable buckets plus the storage deposit and minimum-balance buffer, capped at the
 * value so it can never claim more is locked than the account holds. `value - locked` then
 * reproduces the account bridge's spendable balance, which floors at zero. This mirrors
 * coin-tezos, which likewise reports the total as `value` and the frozen part as `locked`.
 */
export async function getBalance(
  context: NearContext,
  address: string,
  options?: BalanceOptions,
): Promise<Balance[]> {
  // NEAR has one native asset: only the staking-pool options apply.
  if (
    options?.includeAssets ||
    options?.knownAssets ||
    options?.scanAssetsMinHeight !== undefined
  ) {
    throw new InvalidParameterError("getBalance only supports the validator options");
  }
  const config = await context.config();
  const { balance, nearResources } = await getAccount(config, address, {
    ...(options?.knownValidatorIds && {
      knownValidatorIds: options.knownValidatorIds,
      discover: options.listValidators !== false,
    }),
  });

  const nonSpendable = nearResources.stakedBalance
    .plus(nearResources.availableBalance)
    .plus(nearResources.pendingBalance)
    .plus(nearResources.storageUsageBalance);

  const value = BigInt(balance.toFixed(0));
  const frozen = BigInt(nonSpendable.toFixed(0));
  const locked = frozen > value ? value : frozen;

  return [
    { value, asset: NATIVE_ASSET, locked },
    ...toStakes(address, nearResources.stakingPositions).map(stake => ({
      value: stake.amount,
      asset: NATIVE_ASSET,
      stake,
    })),
  ];
}
