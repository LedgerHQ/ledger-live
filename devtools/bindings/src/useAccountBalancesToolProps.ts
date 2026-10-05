import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData, fetchAccountDataBatch } from "@domain/api-account-data-source";
import { computeAccountId } from "@domain/entity-account-alias";
import {
  accountKeyOf,
  currencyIdFromNetwork,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import {
  accountBalanceBinding,
  accountBalancesSlice,
  type WithAccountBalances,
} from "@domain/entity-account-balance";

type AccountBalancesToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-balances" }
>["config"];

type Row = AccountBalancesToolProps["accounts"][number];

export type AccountBalancesInput = {
  descriptor: AccountDescriptor;
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
  const balances = useSelector((state: WithAccountBalances) => state.accountBalances);

  const accounts = useMemo<Row[]>(
    () =>
      inputs.map(({ descriptor, name, granular, units }) => {
        const accountId = computeAccountId(descriptor);
        const balance = selectAccountBalance(balances, accountId);
        const subs = selectSubAccountBalances(balances, accountId);
        const status = selectAccountBalanceStatus(balances, accountId);

        return {
          accountId: accountId,
          name,
          currencyId: currencyIdFromNetwork(descriptor.network),
          address: accountKeyOf(descriptor),
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

  const descriptorsById = useMemo(
    () =>
      new Map(inputs.map(({ descriptor }) => [String(computeAccountId(descriptor)), descriptor])),
    [inputs],
  );

  const onRead = useCallback(
    (accountId: string) => {
      const descriptor = descriptorsById.get(accountId);
      if (!descriptor) return;
      void dispatch(fetchAccountData(accountBalanceBinding, descriptor, { maxAge: 0 }));
    },
    [dispatch, descriptorsById],
  );

  const onReadAll = useCallback(() => {
    void dispatch(
      fetchAccountDataBatch(
        accountBalanceBinding,
        inputs.map(({ descriptor }) => descriptor),
      ),
    );
  }, [dispatch, inputs]);

  return { accounts, onRead, onReadAll, ready: true };
}
