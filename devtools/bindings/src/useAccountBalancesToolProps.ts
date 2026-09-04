import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import {
  fetchAccountBalance,
  getAccountBalanceSources,
  type AccountRef,
} from "@features/platform-account-data";
import { accountBalancesSlice, type WithAccountBalances } from "@domain/entity-account-balance";

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

const { selectAccountBalance, selectSubAccountBalances, selectAccountBalanceStatus } =
  accountBalancesSlice.selectors;

/**
 * Props for the Account Balances devtool.
 *
 * The host passes its accounts already shaped as `AccountRef`s — only it knows how its store holds
 * accounts, and only it can build a ref. Everything else, rows and status alike, is read from the
 * slice: since the status moved into Redux there is nothing else to subscribe to.
 *
 * Reads use `maxAge: 0` so the button always hits the network. `onReadAll` does not, on purpose: it
 * reproduces what a portfolio mount does, and skipping what is already fresh is the behaviour worth
 * being able to observe.
 */
export function useAccountBalancesToolProps(
  inputs: readonly AccountBalancesInput[],
): AccountBalancesToolProps {
  const dispatch = useDispatch<ThunkDispatch<WithAccountBalances, unknown, UnknownAction>>();
  const state = useSelector((state: WithAccountBalances) => state);

  const accounts = useMemo<Row[]>(
    () =>
      inputs.map(({ ref, name, granular, units }) => {
        const balance = selectAccountBalance(state, ref.accountId);
        const subs = selectSubAccountBalances(state, ref.accountId);
        const status = selectAccountBalanceStatus(state, ref.accountId);

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
          status,
        };
      }),
    [inputs, state],
  );

  const refsById = useMemo(
    () => new Map(inputs.map(({ ref }) => [String(ref.accountId), ref])),
    [inputs],
  );

  const onRead = useCallback(
    (accountId: string) => {
      const ref = refsById.get(accountId);
      if (!ref) return;
      void dispatch(fetchAccountBalance(ref, { maxAge: 0 }));
    },
    [dispatch, refsById],
  );

  const onReadAll = useCallback(() => {
    for (const { ref } of inputs) void dispatch(fetchAccountBalance(ref));
  }, [dispatch, inputs]);

  return { accounts, onRead, onReadAll, ready: getAccountBalanceSources().length > 0 };
}
