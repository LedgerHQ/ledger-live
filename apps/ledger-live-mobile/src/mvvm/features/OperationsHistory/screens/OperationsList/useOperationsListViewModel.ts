import { useState, useCallback, useEffect, useMemo } from "react";
import { flattenAccounts, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useSelector, useDispatch } from "~/context/hooks";
import { flattenAccountsSelector, shallowAccountsSelector } from "~/reducers/accounts";
import { lastSeenOperationDateSelector, markOperationsAsSeen } from "~/reducers/history";
import { parseLastSeenMs } from "LLM/features/OperationsHistory/utils/unreadOperations";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import { useOperationsSections } from "./hooks/useOperationsSections";

export type { OperationsListSection } from "./hooks/useOperationsSections";

const INITIAL_OP_COUNT = 50;
const OP_COUNT_INCREMENT = 50;

export function useOperationsListViewModel(accountIds?: string[]) {
  const dispatch = useDispatch();
  const allAccounts = useSelector(shallowAccountsSelector);
  const allFlattenedAccounts = useSelector(flattenAccountsSelector);
  const [opCount, setOpCount] = useState(INITIAL_OP_COUNT);

  const allowedIds = useMemo(
    () => (accountIds && accountIds.length > 0 ? new Set(accountIds) : null),
    [accountIds],
  );

  const accounts = useMemo(() => {
    if (!allowedIds) return allAccounts;
    return allAccounts.filter(root => flattenAccounts([root]).some(a => allowedIds.has(a.id)));
  }, [allAccounts, allowedIds]);

  const flattenedAccounts = useMemo(
    () => (allowedIds ? flattenAccounts(accounts) : allFlattenedAccounts),
    [accounts, allFlattenedAccounts, allowedIds],
  );

  const scopedFilter = useMemo(
    () =>
      allowedIds ? (_op: Operation, account: AccountLike) => allowedIds.has(account.id) : undefined,
    [allowedIds],
  );

  const lastSeenDate = useSelector(lastSeenOperationDateSelector);
  const lastSeenTs = useMemo(() => parseLastSeenMs(lastSeenDate), [lastSeenDate]);

  useEffect(() => {
    return () => {
      dispatch(markOperationsAsSeen());
    };
  }, [dispatch]);

  const { sections: rawSections, completed } = useOperationsV1(accounts, opCount, {
    filterOperation: scopedFilter,
  });

  const accountByAddress = useMemo(() => {
    const map = new Map<string, AccountLike>();
    for (const account of accounts) {
      const { freshAddress } = account;
      if (freshAddress) {
        const currencyId = getAccountCurrency(account).id;
        map.set(`${currencyId}:${freshAddress}`, account);
      }
    }
    return map;
  }, [accounts]);

  const sections = useOperationsSections(rawSections);

  const onEndReached = useCallback(() => {
    if (!completed) {
      setOpCount(count => count + OP_COUNT_INCREMENT);
    }
  }, [completed]);

  const isEmpty = completed && sections.length === 0;

  return {
    accounts,
    flattenedAccounts,
    accountByAddress,
    lastSeenTs,
    sections,
    completed,
    isEmpty,
    onEndReached,
  };
}
