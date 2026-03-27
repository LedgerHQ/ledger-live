import { useState, useCallback, useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector, shallowAccountsSelector } from "~/reducers/accounts";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";

const INITIAL_OP_COUNT = 50;
const OP_COUNT_INCREMENT = 50;

export function useOperationsListViewModel() {
  const accounts = useSelector(shallowAccountsSelector);
  const flattenedAccounts = useSelector(flattenAccountsSelector);
  const [opCount, setOpCount] = useState(INITIAL_OP_COUNT);

  const { sections, completed } = useOperationsV1(accounts, opCount);

  const deduplicatedSections = useMemo(() => {
    const seenIds = new Set<string>();
    return sections
      .map(section => ({
        ...section,
        data: section.data.filter(op => {
          if (seenIds.has(op.id)) return false;
          seenIds.add(op.id);
          return true;
        }),
      }))
      .filter(section => section.data.length > 0);
  }, [sections]);

  const onEndReached = useCallback(() => {
    if (!completed) {
      setOpCount(count => count + OP_COUNT_INCREMENT);
    }
  }, [completed]);

  return {
    accounts,
    flattenedAccounts,
    sections: deduplicatedSections,
    completed,
    onEndReached,
  };
}
