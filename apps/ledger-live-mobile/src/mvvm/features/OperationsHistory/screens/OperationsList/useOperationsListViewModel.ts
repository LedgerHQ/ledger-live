import { useState, useCallback, useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector, shallowAccountsSelector } from "~/reducers/accounts";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { AccountLike, DailyOperationsSection, Operation } from "@ledgerhq/types-live";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";

export type OperationsListSection = DailyOperationsSection & { isPending?: boolean };

const INITIAL_OP_COUNT = 50;
const OP_COUNT_INCREMENT = 50;

export function useOperationsListViewModel() {
  const accounts = useSelector(shallowAccountsSelector);
  const flattenedAccounts = useSelector(flattenAccountsSelector);
  const [opCount, setOpCount] = useState(INITIAL_OP_COUNT);

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

  const onEndReached = useCallback(() => {
    if (!completed) {
      setOpCount(count => count + OP_COUNT_INCREMENT);
    }
  }, [completed]);

  const sections = useMemo((): OperationsListSection[] => {
    const pendingOps: Operation[] = [];
    const regularSections: DailyOperationsSection[] = [];

    for (const section of rawSections) {
      const regular: Operation[] = [];
      for (const op of section.data) {
        if (op.blockHeight === null) pendingOps.push(op);
        else regular.push(op);
      }
      if (regular.length > 0) {
        regularSections.push({ ...section, data: regular });
      }
    }

    if (pendingOps.length === 0) return regularSections;

    const pendingSection: OperationsListSection = {
      isPending: true,
      day: new Date(),
      data: pendingOps,
    };
    return [pendingSection, ...regularSections];
  }, [rawSections]);

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
