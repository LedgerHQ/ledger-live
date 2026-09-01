import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  accountBalanceSelector,
  subAccountBalancesSelector,
  type AccountBalance,
  type WithAccountBalances,
} from "@domain/entity-account-balance";
import type { AccountRef, SliceStatus } from "../port";
import { useAccountDataScheduler } from "../provider";
import type { SubscribeOptions } from "../scheduler";
import { useAccountDataDemand } from "./useAccountDataDemand";
import { useSliceStatus } from "./useSliceStatus";

const NO_BALANCES: readonly AccountBalance[] = [];
const BALANCE_ONLY = ["balance"] as const;

export type UseAccountBalanceResult = {
  /** The account's own balance, `undefined` until first fetched. */
  balance: AccountBalance | undefined;
  /** Balances of the token accounts this account holds — filled by the same single read. */
  subAccountBalances: readonly AccountBalance[];
  status: SliceStatus;
  /** Force a round-trip, ignoring freshness. For a pull-to-refresh. */
  refresh: () => Promise<void>;
};

/**
 * The account's balance, and nothing else.
 *
 * Mounting this registers `balance` demand and nothing more, so on a chain with a granular coin
 * module it costs one `getBalance` call — no operation history, no balance-history derivation, no
 * family resource bag. On a chain without one the router falls back to a full sync, i.e. exactly
 * today's cost: the hook is never worse than what it replaces.
 */
export function useAccountBalance(
  ref: AccountRef | undefined,
  options?: SubscribeOptions,
): UseAccountBalanceResult {
  const scheduler = useAccountDataScheduler();
  const accountId = ref?.accountId;

  const refs = useMemo(() => (ref ? [ref] : []), [ref]);
  useAccountDataDemand(refs, BALANCE_ONLY, options);

  const balance = useSelector((state: WithAccountBalances) =>
    accountId ? accountBalanceSelector(state, { accountId }) : undefined,
  );
  const subAccountBalances = useSelector((state: WithAccountBalances) =>
    accountId ? subAccountBalancesSelector(state, { accountId }) : NO_BALANCES,
  );
  const status = useSliceStatus(accountId, "balance");

  const refresh = useCallback(async () => {
    if (!scheduler || !ref) return;
    await scheduler.fetch({ ref, slices: BALANCE_ONLY, reason: "refresh", maxAge: 0 });
  }, [scheduler, ref]);

  return { balance, subAccountBalances, status, refresh };
}
