import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import {
  BALANCE_HISTORY_RANGES,
  BalanceHistoryRangeSchema,
  DEFAULT_BALANCE_HISTORY_RANGE,
  type AssetBalanceHistory,
  type BalanceHistoryRange,
  type WithAccountBalanceHistories,
} from "@domain/entity-account-balance-history";
import { accountDataQueryKey, type AccountDataRootState } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { formatAmount, useAssetUnits } from "./useAssetUnits";

type AccountBalanceHistoryToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-balance-history" }
>["config"];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = AccountDataRootState & WithAccountBalanceHistories & { accountEntries: AccountsState };

type Dispatch = ThunkDispatch<State, unknown, UnknownAction>;

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

export function useAccountBalanceHistoryToolProps(): AccountBalanceHistoryToolProps {
  const dispatch = useDispatch<Dispatch>();
  const [range, setRange] = useState<BalanceHistoryRange>(DEFAULT_BALANCE_HISTORY_RANGE);
  const entries = useSelector(selectAccountEntries);
  const histories = useSelector((state: State) => state.accountBalanceHistories);
  const statuses = useSelector((state: State) => state.accountData.balanceHistory);

  const assetIds = useMemo(
    () => [
      ...new Set(
        Object.values(histories).flatMap(byRange =>
          Object.values(byRange ?? {}).flatMap(entry => entry?.series.map(s => s.assetId) ?? []),
        ),
      ),
    ],
    [histories],
  );
  const unitOf = useAssetUnits(assetIds, dispatch);

  const descriptors = useMemo(
    () => new Map<string, AccountDescriptor>(entries.map(e => [e.accountUUID, e.descriptor])),
    [entries],
  );

  const read = useCallback(
    (descriptor: AccountDescriptor) =>
      dispatch(fetchAccountData("balanceHistory", descriptor, { maxAge: 0, query: { range } })),
    [dispatch, range],
  );

  const onRead = useCallback(
    (accountUUID: string) => {
      const descriptor = descriptors.get(accountUUID);
      if (descriptor) read(descriptor);
    },
    [descriptors, read],
  );

  const onReadAll = useCallback(() => descriptors.forEach(read), [descriptors, read]);

  const onRangeChange = useCallback((value: string) => {
    const parsed = BalanceHistoryRangeSchema.safeParse(value);
    if (parsed.success) setRange(parsed.data);
  }, []);

  const accounts = useMemo(() => {
    const toSeries = ({ assetId, points }: AssetBalanceHistory) => {
      const unit = unitOf(assetId);
      const first = points.at(0);
      const last = points.at(-1);
      return {
        assetId,
        pointCount: points.length,
        firstDate: first?.date,
        lastDate: last?.date,
        firstBalance: first && formatAmount(unit, first.balance),
        lastBalance: last && formatAmount(unit, last.balance),
        values: points.map(point => Number(point.balance)),
      };
    };
    return entries.map(({ accountUUID, descriptor }) => {
      const status = statuses?.[accountUUID]?.[accountDataQueryKey({ range })];
      return {
        accountUUID,
        descriptor: JSON.stringify(descriptor, null, 2),
        reading: status?.request !== undefined,
        error: status?.error && `${status.error.name}: ${status.error.message}`,
        sourceId: status?.sourceId,
        readAt: status?.readAt,
        series: histories[accountUUID]?.[range]?.series.map(toSeries),
      };
    });
  }, [entries, statuses, histories, range, unitOf]);

  return { ranges: BALANCE_HISTORY_RANGES, range, onRangeChange, accounts, onRead, onReadAll };
}
