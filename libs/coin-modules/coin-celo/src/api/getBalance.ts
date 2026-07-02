import type { Balance, BalanceOptions, Stake } from "@ledgerhq/coin-module-framework/api/index";
import { buildCeloStakes } from "./getStakes";

/** Signature of the base `getBalance` (coin-evm) that we augment. */
type GetBalanceFn = (address: string, options?: BalanceOptions) => Promise<Balance[]>;

/**
 * Wraps coin-evm's `getBalance` to additionally surface Celo staking positions
 * as `Balance` entries with `.stake` set — the shape the generic-coin-framework
 * reads staking from (its `getAccountShape` consumes `Balance.stake`, not
 * `getStakes`). The native (spendable) balance from coin-evm stays first so
 * `extractBalance(..., "native")` still resolves it; the appended entries are
 * consumed only via their `.stake`. Failing to read stakes must not fail the
 * whole balance fetch, so it degrades to the base balances.
 */
export const makeGetBalance =
  (baseGetBalance: GetBalanceFn): GetBalanceFn =>
  async (address, options) => {
    const [base, stakes] = await Promise.all([
      baseGetBalance(address, options),
      buildCeloStakes(address).catch((): Stake[] => []),
    ]);

    // `value` is 0 so these native-typed entries are never mistaken for the account's
    // native balance by `extractBalance("native")`; the staked amount lives on `.stake`.
    const stakeBalances: Balance[] = stakes.map(stake => ({
      value: 0n,
      asset: { type: "native" },
      stake,
    }));

    return [...base, ...stakeBalances];
  };

export default makeGetBalance;
