import { useCallback, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { BigNumber } from "bignumber.js";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import type { WithAccountBalances } from "@domain/entity-account-balance";
import type { AccountDataRootState } from "@domain/entity-account-data";
import type { Currency } from "@domain/entity-currency";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import type { AccountDataRecorder } from "./accountDataRecorder";
import { accountLabel } from "./accountLabel";
import { formatAmount, useAssetCurrencies } from "./assetUnits";

type AccountAggregationToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-aggregation" }
>["config"];

type AggregationRun = AccountAggregationToolProps["runs"][number];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = AccountDataRootState & WithAccountBalances & { accountEntries: AccountsState };

type Dispatch = ThunkDispatch<State, unknown, UnknownAction>;

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** A run with its totals still raw: valued and formatted once currencies and rates resolve. */
type RawRun = Omit<AggregationRun, "totals" | "fiatTotal" | "unvalued"> & {
  totals: { assetId: string; balance: string; accounts: number }[];
};

const RUN_LIMIT = 20;

/** The total balance of the accounts, from what the store holds once every read settled. */
function aggregate(state: State, run: RawRun, sourceCalls: readonly SourceCall[]): RawRun {
  const entries = selectAccountEntries(state);
  const statuses = state.accountData.balance ?? {};
  const totals = new Map<string, { balance: bigint; accounts: number }>();
  const ok = new Map<string, number>();
  let unanswered = 0;
  const perAccount = entries.map(({ accountUUID, descriptor }) => {
    const status = statuses[accountUUID];
    const rows = state.accountBalances[accountUUID] ?? [];
    const label = accountLabel(descriptor);
    if (status?.error) {
      if (status.error.name === "NoAccountDataSourceError") unanswered += 1;
      return {
        accountUUID,
        label,
        error: `${status.error.name}: ${status.error.message}`,
        assets: 0,
      };
    }
    const sourceId = status?.sourceId;
    if (sourceId) ok.set(sourceId, (ok.get(sourceId) ?? 0) + 1);
    rows.forEach(({ assetId, balance }) => {
      const total = totals.get(assetId) ?? { balance: 0n, accounts: 0 };
      totals.set(assetId, {
        balance: total.balance + BigInt(balance),
        accounts: total.accounts + 1,
      });
    });
    return { accountUUID, label, sourceId, assets: rows.length };
  });
  const sourceIds = new Set([...ok.keys(), ...sourceCalls.map(call => call.sourceId)]);
  const sources = [...sourceIds].map(sourceId => {
    const calls = sourceCalls.filter(call => call.sourceId === sourceId);
    return {
      sourceId,
      ok: ok.get(sourceId) ?? 0,
      failed: calls.reduce((sum, call) => sum + call.failed, 0),
      calls: calls.map(({ batch, accounts, failed, elapsedMs }) => ({
        batch,
        accounts,
        failed,
        elapsedMs,
      })),
    };
  });
  const rawTotals = [...totals]
    .filter(([, { balance }]) => balance > 0n)
    .map(([assetId, { balance, accounts }]) => ({
      assetId,
      balance: balance.toString(),
      accounts,
    }));
  const payload = {
    totals: rawTotals,
    accounts: perAccount.map(account => ({
      ...account,
      balances: account.error ? undefined : state.accountBalances[account.accountUUID],
    })),
    sources,
  };
  return {
    ...run,
    durationMs: Date.now() - run.startedAt,
    sources,
    unanswered,
    totals: rawTotals,
    perAccount,
    payload: JSON.stringify(payload, null, 2),
  };
}

type SourceCall = Extract<
  ReturnType<AccountDataRecorder["getEvents"]>[number],
  { type: "source-call" }
>;

/** Collected as they happen: the recorder keeps a bounded window a large run could overflow. */
async function balanceCallsDuring(
  recorder: AccountDataRecorder,
  task: () => Promise<unknown>,
): Promise<SourceCall[]> {
  const calls: SourceCall[] = [];
  let lastSeen = recorder.getEvents().at(-1)?.id ?? -1;
  const unsubscribe = recorder.subscribe(() => {
    for (const event of recorder.getEvents()) {
      if (event.id <= lastSeen) continue;
      lastSeen = event.id;
      if (event.type === "source-call" && event.kind === "balance") calls.push(event);
    }
  });
  try {
    await task();
  } finally {
    unsubscribe();
  }
  return calls;
}

export function useAccountAggregationToolProps(
  recorder: AccountDataRecorder,
  { counterValueCurrency }: Readonly<{ counterValueCurrency: Currency }>,
): AccountAggregationToolProps {
  const dispatch = useDispatch<Dispatch>();
  const store = useStore<State>();
  const entries = useSelector(selectAccountEntries);
  const [runs, setRuns] = useState<RawRun[]>([]);
  const nextId = useRef(1);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);

  const onFetchTotalBalance = useCallback(
    async ({ force }: { force: boolean }) => {
      // One run at a time: two runs would share the store and count each other's calls.
      if (runningRef.current) return;
      runningRef.current = true;
      setRunning(true);
      const descriptors = selectAccountEntries(store.getState()).map(entry => entry.descriptor);
      const started: RawRun = {
        id: nextId.current++,
        startedAt: Date.now(),
        force,
        accounts: descriptors.length,
        sources: [],
        unanswered: 0,
        totals: [],
        perAccount: [],
        payload: "",
      };
      setRuns(current => [started, ...current].slice(0, RUN_LIMIT));
      // Dispatched in one go, so the router routes them as one batch.
      const sourceCalls = await balanceCallsDuring(recorder, () =>
        Promise.allSettled(
          descriptors.map(descriptor =>
            dispatch(fetchAccountData("balance", descriptor, force ? { maxAge: 0 } : {})),
          ),
        ),
      );
      runningRef.current = false;
      setRunning(false);
      const done = aggregate(store.getState(), started, sourceCalls);
      setRuns(current => current.map(run => (run.id === done.id ? done : run)));
    },
    [dispatch, store, recorder],
  );

  const onClear = useCallback(() => setRuns([]), []);

  const assetIds = useMemo(
    () => [...new Set(runs.flatMap(run => run.totals.map(total => total.assetId)))],
    [runs],
  );
  const currencyOf = useAssetCurrencies(assetIds, dispatch);
  const countervalueOf = useCalculateCountervalueCallback({ to: counterValueCurrency });
  const fiatUnit = counterValueCurrency.units[0];

  const formatted = useMemo(
    () =>
      runs.map(run => {
        const valued = run.totals.map(total => {
          const currency = currencyOf(total.assetId);
          const fiat = currency && countervalueOf(currency, new BigNumber(total.balance));
          return { total, currency, fiat: fiat ?? undefined };
        });
        const fiatTotal = valued.reduce(
          (sum, { fiat }) => (fiat ? sum.plus(fiat) : sum),
          new BigNumber(0),
        );
        const fiatTotalText = formatAmount(fiatUnit, fiatTotal.integerValue().toFixed());
        return {
          ...run,
          payload:
            run.payload &&
            JSON.stringify({ fiatTotal: fiatTotalText, ...JSON.parse(run.payload) }, null, 2),
          fiatTotal: fiatTotalText,
          unvalued: valued.filter(({ fiat }) => fiat === undefined).length,
          totals: valued
            .sort((a, b) => (b.fiat?.toNumber() ?? -1) - (a.fiat?.toNumber() ?? -1))
            .map(({ total, currency, fiat }) => ({
              ...total,
              balance: formatAmount(currency?.units[0], total.balance),
              fiat: fiat && formatAmount(fiatUnit, fiat.integerValue().toFixed()),
            })),
        };
      }),
    [runs, currencyOf, countervalueOf, fiatUnit],
  );

  return {
    accountCount: entries.length,
    running,
    runs: formatted,
    onFetchTotalBalance,
    onClear,
  };
}
