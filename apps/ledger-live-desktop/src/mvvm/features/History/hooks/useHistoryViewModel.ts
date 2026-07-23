import { useCallback, useEffect, useMemo } from "react";
import {
  formatSmallValueOperationsThreshold,
  SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
} from "@ledgerhq/live-common/hideSmallValueTokenOperations/smallValueOperationsThreshold";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useHideSmallValueTokenOperations } from "~/renderer/actions/settings";
import { addExtraTrackingPairs } from "~/renderer/reducers/countervaluesExtraTracking";
import {
  historyDustFilterCounterValueCurrencyForDisplaySelector,
  historyDustFilterCountervaluesStateForDisplaySelector,
  historyDustFilteringFeatureEnabledSelector,
  historyDustFilterLocaleSelector,
  markOperationsAsSeen,
} from "~/renderer/reducers/history";
import type { Virtualizer } from "@tanstack/react-virtual";
import { OperationDetails } from "~/renderer/drawers/OperationDetails";
import { setDrawer } from "~/renderer/drawers/Provider";
import { useHistoryOperations } from "./useHistoryOperations";
import { useHistoryTable } from "./useHistoryTable";
import { useHistoryVirtualization } from "./useHistoryVirtualization";
import type { HistoryTable, OperationRow, VirtualItem } from "../types";
import { track } from "~/renderer/analytics/segment";
import { parseHistoryBackPath } from "../utils/historyLocationState";
import { usePopNavigationBack } from "LLD/utils/usePopNavigationBack";
import { HISTORY_DUST_FILTER_THRESHOLD_USD } from "../constants";

export type HistoryViewModel = {
  showBackButton: boolean;
  navigateBack: () => void;
  table: HistoryTable;
  parentRef: React.RefObject<HTMLDivElement | null>;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  flatItems: VirtualItem[];
  onRowClick: (row: OperationRow) => void;
  onExportClick: () => void;
  operationsCount: number;
  hasPendingOperations: boolean;
  showDustFilterOption: boolean;
  hideSmallValueTokenOperations: boolean;
  dustFilterThreshold: string;
  onToggleHideSmallValueTokenOperations: () => void;
};

export function useHistoryViewModel(): HistoryViewModel {
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      dispatch(markOperationsAsSeen());
    };
  }, [dispatch]);

  const { showBackButton, navigateBack } = usePopNavigationBack(parseHistoryBackPath);

  const operations = useHistoryOperations();
  const table = useHistoryTable(operations);
  const { parentRef, rowVirtualizer, flatItems } = useHistoryVirtualization(table);

  const onRowClick = useCallback((row: OperationRow) => {
    const { operation, account, parentAccount } = row.original;
    track("transaction_clicked", {
      transaction: operation.type,
    });
    setDrawer(OperationDetails, {
      operationId: operation.id,
      accountId: account.id,
      parentId: parentAccount?.id,
    });
  }, []);

  const onExportClick = () => track("ExportAccountOperations");
  const operationsCount = flatItems.length;
  const hasPendingOperations = useMemo(() => operations.some(op => op.isPending), [operations]);
  const [hideSmallValueTokenOperations, setHideSmallValueTokenOperations] =
    useHideSmallValueTokenOperations();
  const showDustFilterOption = useSelector(historyDustFilteringFeatureEnabledSelector);
  const counterValueCurrency = useSelector(historyDustFilterCounterValueCurrencyForDisplaySelector);
  const countervaluesState = useSelector(historyDustFilterCountervaluesStateForDisplaySelector);
  useEffect(() => {
    if (
      !showDustFilterOption ||
      !counterValueCurrency ||
      counterValueCurrency.ticker === SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY.ticker
    ) {
      return;
    }

    dispatch(
      addExtraTrackingPairs([
        {
          from: SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
          to: counterValueCurrency,
          startDate: new Date(),
        },
      ]),
    );
  }, [counterValueCurrency, dispatch, showDustFilterOption]);
  const locale = useSelector(historyDustFilterLocaleSelector);
  const dustFilterThreshold = useMemo(() => {
    if (!counterValueCurrency) return "";

    return formatSmallValueOperationsThreshold({
      countervaluesState,
      counterValueCurrency,
      locale,
      thresholdUsd: HISTORY_DUST_FILTER_THRESHOLD_USD,
    });
  }, [countervaluesState, counterValueCurrency, locale]);
  const onToggleHideSmallValueTokenOperations = useCallback(() => {
    if (!showDustFilterOption) return;
    const enabled = !hideSmallValueTokenOperations;
    track("button_clicked", {
      button: "dust_filter",
      enabled,
    });
    setHideSmallValueTokenOperations(enabled);
  }, [hideSmallValueTokenOperations, setHideSmallValueTokenOperations, showDustFilterOption]);

  return {
    showBackButton,
    navigateBack,
    table,
    parentRef,
    rowVirtualizer,
    flatItems,
    onRowClick,
    onExportClick,
    operationsCount,
    hasPendingOperations,
    showDustFilterOption,
    hideSmallValueTokenOperations,
    dustFilterThreshold,
    onToggleHideSmallValueTokenOperations,
  };
}
