import { useState, useCallback, useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector, shallowAccountsSelector } from "~/reducers/accounts";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { AccountLike } from "@ledgerhq/types-live";

const INITIAL_OP_COUNT = 50;
const OP_COUNT_INCREMENT = 50;

export function useOperationsListViewModel() {
  const accounts = useSelector(shallowAccountsSelector);
  const flattenedAccounts = useSelector(flattenAccountsSelector);
  const [opCount, setOpCount] = useState(INITIAL_OP_COUNT);

  const { sections, completed } = useOperationsV1(accounts, opCount);

  const accountByAddress = useMemo(() => {
    const map = new Map<string, AccountLike>();
    for (const account of accounts) {
      const { freshAddress } = account;
      if (freshAddress) {
        map.set(freshAddress, account);
      }
    }
    return map;
  }, [accounts]);

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
    sections,
    completed,
    isEmpty,
    onEndReached,
  };
}
