import { useState, useCallback, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { flattenAccountsSelector, shallowAccountsSelector } from "~/reducers/accounts";
import { lastSeenOperationDateSelector, markOperationsAsSeen } from "~/reducers/history";
import { parseLastSeenMs } from "LLM/features/OperationsHistory/utils/unreadOperations";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useOperationsSections } from "./hooks/useOperationsSections";

export type { OperationsListSection } from "./hooks/useOperationsSections";

const INITIAL_OP_COUNT = 50;
const OP_COUNT_INCREMENT = 50;

export function useOperationsListViewModel() {
  const dispatch = useDispatch();
  const accounts = useSelector(shallowAccountsSelector);
  const flattenedAccounts = useSelector(flattenAccountsSelector);
  const [opCount, setOpCount] = useState(INITIAL_OP_COUNT);

  const lastSeenDate = useSelector(lastSeenOperationDateSelector);
  const lastSeenTs = useMemo(() => parseLastSeenMs(lastSeenDate), [lastSeenDate]);

  useEffect(() => {
    return () => {
      dispatch(markOperationsAsSeen());
    };
  }, [dispatch]);

  const { sections: rawSections, completed } = useOperationsV1(accounts, opCount);

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
