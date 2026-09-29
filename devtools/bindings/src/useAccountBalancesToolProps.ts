import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import type { AccountRef } from "@features/platform-account-data";
import { useAccountDataRouter } from "@features/platform-account-data/react";
import { fetchAccountBalance } from "@features/platform-account-balance";
import { accountBalancesSlice, type WithAccountBalances } from "@domain/entity-account-balance";

type AccountBalancesToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-balances" }
>["config"];

type Row = AccountBalancesToolProps["accounts"][number];

export type AccountBalancesInput = {
  ref: AccountRef;
  name: string;
  granular: boolean;
  units: Readonly<Record<string, { code: string; magnitude: number }>>;
};

const { selectAccountBalance, selectSubAccountBalances, selectAccountBalanceStatus } =
  accountBalancesSlice.getSelectors();

export function useAccountBalancesToolProps(
  inputs: readonly AccountBalancesInput[],
): AccountBalancesToolProps {
  const dispatch = useDispatch<ThunkDispatch<WithAccountBalances, unknown, UnknownAction>>();
  const router = useAccountDataRouter();
  const balances = useSelector((state: WithAccountBalances) => state.accountBalances);

  const accounts = useMemo<Row[]>(
    () =>
      inputs.map(({ ref, name, granular, units }) => {
        const balance = selectAccountBalance(balances, ref.accountId);
        const subs = selectSubAccountBalances(balances, ref.accountId);
        const status = selectAccountBalanceStatus(balances, ref.accountId);

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
    [inputs, balances],
  );

  const refsById = useMemo(
    () => new Map(inputs.map(({ ref }) => [String(ref.accountId), ref])),
    [inputs],
  );

  const onRead = useCallback(
    (accountId: string) => {
      const ref = refsById.get(accountId);
      if (!ref) return;
      void dispatch(fetchAccountBalance(router, ref, { maxAge: 0 }));
    },
    [dispatch, router, refsById],
  );

  const onReadAll = useCallback(() => {
    for (const { ref } of inputs) void dispatch(fetchAccountBalance(router, ref));
  }, [dispatch, router, inputs]);

  return { accounts, onRead, onReadAll, ready: true };
}
