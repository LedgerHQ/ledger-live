import { useState, useCallback, useEffect, useMemo, type ComponentType } from "react";
import { useDustFilteringFeature, useFeature } from "@features/platform-feature-flags";
import { flattenAccounts, getAccountCurrency } from "@ledgerhq/live-common/account/index";
import {
  formatSmallValueOperationsThreshold,
  SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
} from "@ledgerhq/live-common/hideSmallValueTokenOperations/smallValueOperationsThreshold";
import type { IconProps } from "@ledgerhq/lumen-ui-rnative";
import { Eye, EyeCross } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { CardAssetRow } from "@features/flow-pay-card-assets";
import { addExtraSessionTrackingPair } from "~/actions/general";
import { setHideSmallValueTokenOperations } from "~/actions/settings";
import { track } from "~/analytics";
import { useSelector, useDispatch } from "~/context/hooks";
import { useLocale, useTranslation } from "~/context/Locale";
import { flattenAccountsSelector, shallowAccountsSelector } from "~/reducers/accounts";
import { countervaluesStateSelector } from "~/reducers/countervalues";
import { lastSeenOperationDateSelector, markOperationsAsSeen } from "~/reducers/history";
import {
  counterValueCurrencySelector,
  hideSmallValueTokenOperationsEnabledSelector,
} from "~/reducers/settings";
import { parseLastSeenMs } from "LLM/features/OperationsHistory/utils/unreadOperations";
import { useOperationsV1 } from "~/screens/Analytics/Operations/useOperationsV1";
import { AccountLike, Operation } from "@ledgerhq/types-live";
import { useOperationsSections } from "./hooks/useOperationsSections";
import {
  HISTORY_DUST_FILTER_THRESHOLD_USD,
  HISTORY_TAB_CARD,
  HISTORY_TAB_CRYPTO,
  type HistoryTab,
} from "LLM/features/OperationsHistory/constants";
import type { HistoryScope } from "LLM/features/OperationsHistory/types";

export type { OperationsListSection } from "./hooks/useOperationsSections";

export type OperationsHistoryDustFilterOption = Readonly<{
  Icon: ComponentType<IconProps>;
  title: string;
  description: string;
}>;

const INITIAL_OP_COUNT = 50;
const OP_COUNT_INCREMENT = 50;

export function resolveHistoryPresentation(
  scope: HistoryScope,
  payTabEnabled: boolean,
  userTab: HistoryTab | undefined,
): Readonly<{
  tab: HistoryTab;
  showSwitcher: boolean;
  cardAsset: CardAssetRow | undefined;
}> {
  if (scope.kind === "cardAsset") {
    return { tab: HISTORY_TAB_CARD, showSwitcher: false, cardAsset: scope.asset };
  }

  const canShowCard = scope.kind === "pay" && payTabEnabled;
  const tab = canShowCard && userTab === HISTORY_TAB_CARD ? HISTORY_TAB_CARD : HISTORY_TAB_CRYPTO;
  return { tab, showSwitcher: canShowCard, cardAsset: undefined };
}

export function useOperationsListViewModel(scope: HistoryScope) {
  const dispatch = useDispatch();
  const allAccounts = useSelector(shallowAccountsSelector);
  const allFlattenedAccounts = useSelector(flattenAccountsSelector);
  const [opCount, setOpCount] = useState(INITIAL_OP_COUNT);
  const [isOptionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const [userTab, setUserTab] = useState<HistoryTab>();
  const isPayTabEnabled = !!useFeature("lwmPayTab")?.enabled;
  const historyPresentation = resolveHistoryPresentation(scope, isPayTabEnabled, userTab);
  const accountIds = scope.kind === "account" ? scope.accountIds : undefined;
  const { isEnabled: isDustFilterFeatureEnabled } = useDustFilteringFeature("mobile");
  const userHideSmallValueTokenOperations = useSelector(
    hideSmallValueTokenOperationsEnabledSelector,
  );
  const counterValueCurrency = useSelector(state =>
    isDustFilterFeatureEnabled ? counterValueCurrencySelector(state) : undefined,
  );
  const isReferenceCounterValue =
    counterValueCurrency?.ticker === SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY.ticker;
  const countervaluesState = useSelector(state =>
    isDustFilterFeatureEnabled && counterValueCurrency && !isReferenceCounterValue
      ? countervaluesStateSelector(state)
      : undefined,
  );
  const { locale } = useLocale();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isDustFilterFeatureEnabled || !counterValueCurrency || isReferenceCounterValue) {
      return;
    }

    addExtraSessionTrackingPair({
      from: SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
      to: counterValueCurrency,
      startDate: new Date(),
    });
  }, [counterValueCurrency, isDustFilterFeatureEnabled, isReferenceCounterValue]);

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

    return formatSmallValueOperationsThreshold({
      countervaluesState,
      counterValueCurrency,
      locale,
      thresholdUsd: HISTORY_DUST_FILTER_THRESHOLD_USD,
    });
  }, [countervaluesState, counterValueCurrency, locale]);

  const dustFilterOption: OperationsHistoryDustFilterOption | undefined = useMemo(() => {
    if (!isDustFilterFeatureEnabled || !dustFilterThreshold) return undefined;

    const Icon = userHideSmallValueTokenOperations ? Eye : EyeCross;
    const title = userHideSmallValueTokenOperations
      ? t("operationsList.options.showDustTransactions")
      : t("operationsList.options.hideDustTransactions");
    const descriptionKey = userHideSmallValueTokenOperations
      ? "operationsList.options.dustTransactionsDisplayedDescription"
      : "operationsList.options.dustTransactionsHiddenDescription";

    return {
      Icon,
      title,
      description: t(descriptionKey, {
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
  const onHistoryTabChange = useCallback(
    (tab: HistoryTab) => {
      if (scope.kind !== "pay") return;

      track("button_clicked", {
        button: tab,
        page: "OperationsList",
      });
      setUserTab(tab);
    },
    [scope.kind],
  );

  const onToggleHideSmallValueTokenOperations = useCallback(() => {
    if (!isDustFilterFeatureEnabled) return;

    const isEnabled = !userHideSmallValueTokenOperations;

    track("button_clicked", {
      button: "dust_filter",
      enabled: isEnabled,
    });
    dispatch(setHideSmallValueTokenOperations(isEnabled));
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
    showHistoryTypeSwitcher: historyPresentation.showSwitcher,
    historyTab: historyPresentation.tab,
    cardAsset: historyPresentation.cardAsset,
    onHistoryTabChange,
  };
}

export type OperationsListViewModel = ReturnType<typeof useOperationsListViewModel>;
