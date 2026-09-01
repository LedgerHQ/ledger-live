import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import type { DevToolsConfig } from "@devtools/registry";
import type { AccountRef } from "@features/platform-account-data";
import { useAccountDataScheduler, useSliceStatuses } from "@features/platform-account-data/react";
import {
  accountBalanceSelector,
  subAccountBalancesSelector,
  type WithAccountBalances,
} from "@domain/entity-account-balance";

type AccountBalancesToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-balances" }
>["config"];

type Row = AccountBalancesToolProps["accounts"][number];

/** The minimum a host must tell the tool about one of its accounts. */
export type AccountBalancesInput = {
  ref: AccountRef;
  name: string;
  /** Whether a coin module declares it can serve this account's balance on its own. */
  granular: boolean;
  /**
   * Display unit per asset id, so amounts render as `0.0153 ETH` rather than as smallest units.
   * The host supplies it because only it holds the resolved currencies and tokens.
   */
  units: Readonly<Record<string, { code: string; magnitude: number }>>;
};

/**
 * Props for the Account Balances devtool.
 *
 * The host passes its accounts already shaped as `AccountRef`s — only it knows how its store holds
 * accounts, and only it can build a ref. Everything else is read here: the balance table through the
 * entity selectors, and the per-slice status through the scheduler the app mounted.
 *
 * Reads use `maxAge: 0` so the button always hits the network. `onReadAll` does not, on purpose: it
 * reproduces what a portfolio mount does, and skipping what is already fresh is the behaviour worth
 * being able to observe.
 */
export function useAccountBalancesToolProps(
  inputs: readonly AccountBalancesInput[],
): AccountBalancesToolProps {
  const scheduler = useAccountDataScheduler();

  const table = useSelector((state: WithAccountBalances) => state.accountBalances);

  const accountIds = useMemo(() => inputs.map(({ ref }) => ref.accountId), [inputs]);
  // Subscribed, not read inside the memo below: statuses live outside Redux, so nothing would
  // invalidate the memo when one changes — `Reading…` would never appear, and a failure that writes
  // no balance would never be shown at all.
  const statuses = useSliceStatuses(accountIds, "balance");

  const accounts = useMemo<Row[]>(() => {
    // One wrapper for the whole pass: the selectors read `state.accountBalances`, and the memoized
    // parent index keys off that table's identity, so a literal per row would only add garbage.
    const state: WithAccountBalances = { accountBalances: table };

    return inputs.map(({ ref, name, granular, units }, index) => {
      const balance = accountBalanceSelector(state, {
        accountId: ref.accountId,
      });
      const subs = subAccountBalancesSelector(state, {
        accountId: ref.accountId,
      });
      const status = statuses[index];

      return {
        accountId: ref.accountId,
        name,
        currencyId: ref.currencyId,
        address: ref.address,
        granular,
        balance: balance && {
          assetId: balance.assetId,
          unit: units[balance.assetId],
          value: balance.balance,
          spendable: balance.spendableBalance,
          at: balance.at,
        },
        tokens: subs.map(sub => ({
          assetId: sub.assetId,
          unit: units[sub.assetId],
          value: sub.balance,
          spendable: sub.spendableBalance,
          at: sub.at,
        })),
        status: {
          pending: status?.pending ?? false,
          sourceId: status?.sourceId,
          error: status?.error?.message,
          lastFetchedAt: status?.lastFetchedAt,
        },
      };
    });
  }, [inputs, table, statuses]);

  const refsById = useMemo(
    () => new Map(inputs.map(({ ref }) => [String(ref.accountId), ref])),
    [inputs],
  );

  const onRead = useCallback(
    (accountId: string) => {
      const ref = refsById.get(accountId);
      if (!scheduler || !ref) return;
      void scheduler.fetch({
        ref,
        slices: ["balance"],
        reason: "devtool",
        maxAge: 0,
      });
    },
    [scheduler, refsById],
  );

  const onReadAll = useCallback(() => {
    if (!scheduler) return;
    for (const { ref } of inputs) {
      void scheduler.fetch({ ref, slices: ["balance"], reason: "devtool-all" });
    }
  }, [scheduler, inputs]);

  return { accounts, onRead, onReadAll, ready: scheduler !== null };
}
