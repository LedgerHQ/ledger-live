import { useCallback, useEffect, useMemo } from "react";
import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  convertThresholdFromUsdToCountervalueMinorUnit,
  floorThresholdToCurrencyMinorUnit,
  SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
} from "@ledgerhq/live-common/hideSmallValueTokenOperations/smallValueOperationsThreshold";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
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

export function formatDustFilterThreshold({
  countervaluesState,
  counterValueCurrency,
  locale,
  thresholdUsd,
}: {
  countervaluesState?: CounterValuesState;
  counterValueCurrency: Currency;
  locale: string | undefined | null;
  thresholdUsd: number;
}) {
  const formatThreshold = (currency: Currency, unit: Unit = currency.units[0]) => {
    const thresholdMinorUnit =
      floorThresholdToCurrencyMinorUnit(thresholdUsd, currency) ?? new BigNumber(0);

    return formatCurrencyUnit(unit, thresholdMinorUnit, {
      showCode: true,
      locale: locale ?? undefined,
    });
  };
  const formatCounterValueThreshold = (currency: Currency, thresholdMinorUnit: BigNumber) => {
    const unit = currency.units[0];
    const amount = thresholdMinorUnit.div(new BigNumber(10).pow(unit.magnitude));
    const fractionDigits = Math.min(Math.max(unit.magnitude + 2, 4), 8);
    const formattedAmount = new Intl.NumberFormat(locale ?? undefined, {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: 0,
      useGrouping: false,
    }).format(amount.toNumber());

    return unit.prefixCode
      ? `${unit.code}${formattedAmount}`
      : `${formattedAmount}\u00A0${unit.code}`;
  };

  const referenceThreshold = formatThreshold(SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY, {
    ...SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY.units[0],
    code: "US$",
  });

  if (counterValueCurrency.ticker === SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY.ticker) {
    return referenceThreshold;
  }

  if (!countervaluesState) return referenceThreshold;

  const counterValueThresholdMinorUnit = convertThresholdFromUsdToCountervalueMinorUnit({
    counterValueCurrency,
    countervaluesState,
    thresholdUsd,
  });

  if (!counterValueThresholdMinorUnit) return referenceThreshold;

  return `${referenceThreshold} (${formatCounterValueThreshold(
    counterValueCurrency,
    counterValueThresholdMinorUnit,
  )})`;
}

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

    return formatDustFilterThreshold({
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
