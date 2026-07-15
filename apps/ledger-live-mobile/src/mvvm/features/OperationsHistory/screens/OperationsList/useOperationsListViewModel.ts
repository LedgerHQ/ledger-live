import { useState, useCallback, useEffect, useMemo, type ComponentType } from "react";
import BigNumber from "bignumber.js";
import { useDustFilteringFeature } from "@features/platform-feature-flags";
import { flattenAccounts, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { floorThresholdToCurrencyMinorUnit } from "@ledgerhq/live-common/hideSmallValueTokenOperations/smallValueOperationsThreshold";
import type { IconProps } from "@ledgerhq/lumen-ui-rnative";
import { Eye, EyeCross } from "@ledgerhq/lumen-ui-rnative/symbols";
import { setHideSmallValueTokenOperations } from "~/actions/settings";
import { useSelector, useDispatch } from "~/context/hooks";
import { useLocale, useTranslation } from "~/context/Locale";
import { flattenAccountsSelector, shallowAccountsSelector } from "~/reducers/accounts";
import { lastSeenOperationDateSelector, markOperationsAsSeen } from "~/reducers/history";
import {
  counterValueCurrencySelector,
  hideSmallValueTokenOperationsEnabledSelector,
} from "~/reducers/settings";
import { parseLastSeenMs } from "LLM/features/OperationsHistory/utils/unreadOperations";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import { useOperationsSections } from "./hooks/useOperationsSections";
import { HISTORY_DUST_FILTER_THRESHOLD_USD } from "LLM/features/OperationsHistory/constants";

export type { OperationsListSection } from "./hooks/useOperationsSections";

export type OperationsHistoryDustFilterOption = Readonly<{
  Icon: ComponentType<IconProps>;
  title: string;
  description: string;
}>;

const INITIAL_OP_COUNT = 50;
const OP_COUNT_INCREMENT = 50;

export function useOperationsListViewModel(accountIds?: string[]) {
  const dispatch = useDispatch();
  const allAccounts = useSelector(shallowAccountsSelector);
  const allFlattenedAccounts = useSelector(flattenAccountsSelector);
  const [opCount, setOpCount] = useState(INITIAL_OP_COUNT);
  const [isOptionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const { isEnabled: isDustFilterFeatureEnabled } = useDustFilteringFeature("mobile");
  const userHideSmallValueTokenOperations = useSelector(
    hideSmallValueTokenOperationsEnabledSelector,
  );
  const counterValueCurrency = useSelector(state =>
    isDustFilterFeatureEnabled ? counterValueCurrencySelector(state) : undefined,
  );
  const { locale } = useLocale();
  const { t } = useTranslation();

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

  const hasPendingOperations = useMemo(() => sections.some(s => s.isPending), [sections]);
  const dustFilterThreshold = useMemo(() => {
    if (!counterValueCurrency) return undefined;

    const thresholdMinorUnit =
      floorThresholdToCurrencyMinorUnit(HISTORY_DUST_FILTER_THRESHOLD_USD, counterValueCurrency) ??
      new BigNumber(0);

    return formatCurrencyUnit(counterValueCurrency.units[0], thresholdMinorUnit, {
      showCode: true,
      locale,
    });
  }, [counterValueCurrency, locale]);
  const dustFilterOption: OperationsHistoryDustFilterOption | undefined = useMemo(() => {
    if (!isDustFilterFeatureEnabled || !dustFilterThreshold) return undefined;

    const Icon = userHideSmallValueTokenOperations ? Eye : EyeCross;
    const title = userHideSmallValueTokenOperations
      ? t("operationsList.options.showDustTransactions")
      : t("operationsList.options.hideDustTransactions");

    return {
      Icon,
      title,
      description: t("operationsList.options.dustTransactionsDescription", {
        threshold: dustFilterThreshold,
      }),
    };
  }, [dustFilterThreshold, isDustFilterFeatureEnabled, userHideSmallValueTokenOperations, t]);

  const openOptionsSheet = useCallback(() => {
    if (isDustFilterFeatureEnabled) {
      setOptionsSheetOpen(true);
    }
  }, [isDustFilterFeatureEnabled]);
  const closeOptionsSheet = useCallback(() => setOptionsSheetOpen(false), []);
  const onToggleHideSmallValueTokenOperations = useCallback(() => {
    if (!isDustFilterFeatureEnabled) return;

    dispatch(setHideSmallValueTokenOperations(!userHideSmallValueTokenOperations));
    closeOptionsSheet();
  }, [dispatch, isDustFilterFeatureEnabled, userHideSmallValueTokenOperations, closeOptionsSheet]);

  return {
    accounts,
    flattenedAccounts,
    accountByAddress,
    lastSeenTs,
    sections,
    completed,
    isEmpty,
    hasPendingOperations,
    onEndReached,
    isOptionsSheetOpen,
    openOptionsSheet,
    closeOptionsSheet,
    hideSmallValueTokenOperations: isDustFilterFeatureEnabled && userHideSmallValueTokenOperations,
    isDustFilterFeatureEnabled,
    dustFilterOption,
    onToggleHideSmallValueTokenOperations,
  };
}
