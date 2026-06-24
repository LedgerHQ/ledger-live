import { useCallback, useEffect, useMemo } from "react";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { floorThresholdToCurrencyMinorUnit } from "@ledgerhq/live-common/hideSmallValueTokenOperations/smallValueOperationsThreshold";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useHideSmallValueTokenOperations } from "~/renderer/actions/settings";
import { markOperationsAsSeen } from "~/renderer/reducers/history";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
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
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const dustFilterThreshold = useMemo(() => {
    const thresholdMinorUnit =
      floorThresholdToCurrencyMinorUnit(HISTORY_DUST_FILTER_THRESHOLD_USD, counterValueCurrency) ??
      new BigNumber(0);

    return formatCurrencyUnit(counterValueCurrency.units[0], thresholdMinorUnit, {
      showCode: true,
      locale,
    });
  }, [counterValueCurrency, locale]);
  const onToggleHideSmallValueTokenOperations = useCallback(() => {
    setHideSmallValueTokenOperations(!hideSmallValueTokenOperations);
  }, [hideSmallValueTokenOperations, setHideSmallValueTokenOperations]);

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
    hideSmallValueTokenOperations,
    dustFilterThreshold,
    onToggleHideSmallValueTokenOperations,
  };
}
