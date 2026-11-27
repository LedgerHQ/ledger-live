import type { AssetInfo, Balance, BalanceOptions } from "@ledgerhq/coin-module-framework/api/index";
import type { NearContext } from "../config";
import { getAccount } from "../network";
import { toStakes } from "./getStakes";

export const NATIVE_ASSET: AssetInfo = { type: "native" };

/**
 * Native balance partitions: the liquid funds, then one entry per staking position.
 *
 * The entries are disjoint parts of the account, so the native values add up to the account
 * total. The first entry holds the funds on the account itself. Its `locked` is the storage
 * deposit plus the minimum-balance buffer, capped at its value, so `value - locked` reproduces
 * the account bridge's spendable balance, which floors at zero. Each staking entry holds a staked,
 * pending or withdrawable position in a pool, and is fully locked: the account cannot spend it
 * until it is withdrawn.
 *
 * The plain native entry is always emitted first, so an account with nothing reports a zero
 * native balance.
 *
 * `knownValidatorIds` and `listValidators` are passed to the staking positions read: the pools the
 * caller knows are read from the node when the listing fails or is skipped.
 */
export async function getBalance(
  context: NearContext,
  address: string,
  options?: Pick<BalanceOptions, "knownValidatorIds" | "listValidators">,
): Promise<Balance[]> {
  const config = await context.config();
  const { balance, nearResources } = await getAccount(config, address, {
    ...(options?.knownValidatorIds !== undefined
      ? { knownValidatorIds: options.knownValidatorIds }
      : {}),
    ...(options?.listValidators !== undefined ? { listValidators: options.listValidators } : {}),
  });

  const pooled = nearResources.stakedBalance
    .plus(nearResources.availableBalance)
    .plus(nearResources.pendingBalance);

  const liquid = BigInt(balance.minus(pooled).toFixed(0));
  const value = liquid > 0n ? liquid : 0n;
  const reserve = BigInt(nearResources.storageUsageBalance.toFixed(0));
  const locked = reserve > value ? value : reserve;

  return [
    { value, asset: NATIVE_ASSET, locked },
    ...toStakes(address, nearResources.stakingPositions).map(stake => ({
      value: stake.amount,
      asset: NATIVE_ASSET,
      locked: stake.amount,
      stake,
    })),
  ];
}
