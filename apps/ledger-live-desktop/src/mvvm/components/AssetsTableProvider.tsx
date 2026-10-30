import React, { useCallback, useMemo, type ReactNode } from "react";
import type { AccountLike, PortfolioRange } from "@ledgerhq/types-live";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import {
  getCurrencyPortfolio,
  getCurrentBalanceCountervalueChange,
} from "@ledgerhq/live-common/portfolio/portfolio";
import { formatPrice } from "@ledgerhq/live-currency-format";
import { useCountervaluesState } from "@features/platform-market-countervalues";
import {
  AssetsTablePortsProvider,
  type AssetTrendRange,
  type AssetsTablePorts,
  type FormatAssetAmount,
} from "@features/platform-assets-table";
import { useSelector } from "LLD/hooks/redux";
import { BalanceCell } from "LLD/components/Cells/BalanceCell";
import { CounterValueCell } from "LLD/components/Cells/CounterValueCell";
import { TruncatedText } from "LLD/components/TruncatedText";
import { counterValueCurrencySelector, discreetModeSelector } from "~/renderer/reducers/settings";

const formatCounterValue: FormatAssetAmount = (unit, value, options) =>
  formatCurrencyUnit(unit, value, { showCode: options?.showCode });

const formatAssetPrice: FormatAssetAmount = (unit, value, options) =>
  formatPrice(unit, value, { showCode: options?.showCode });

export function DesktopAssetsTableProvider({ children }: { readonly children: ReactNode }) {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const countervaluesState = useCountervaluesState();

  const getCurrencyPortfolioForTable = useCallback(
    (accounts: readonly unknown[], range: AssetTrendRange) =>
      getCurrencyPortfolio(
        accounts as AccountLike[],
        range as PortfolioRange,
        countervaluesState,
        counterValueCurrency,
      ),
    [countervaluesState, counterValueCurrency],
  );

  const getCurrentBalanceCountervalueChangeForTable = useCallback(
    (accounts: readonly unknown[], range: AssetTrendRange) =>
      getCurrentBalanceCountervalueChange(
        accounts as AccountLike[],
        range as PortfolioRange,
        countervaluesState,
        counterValueCurrency,
      ),
    [countervaluesState, counterValueCurrency],
  );

  const ports = useMemo<AssetsTablePorts>(
    () => ({
      counterValueCurrency,
      discreet,
      formatCounterValue,
      formatPrice: formatAssetPrice,
      getCurrencyPortfolio: getCurrencyPortfolioForTable,
      getCurrentBalanceCountervalueChange: getCurrentBalanceCountervalueChangeForTable,
      BalanceCell,
      CounterValueCell,
      TruncatedText,
    }),
    [
      counterValueCurrency,
      discreet,
      getCurrencyPortfolioForTable,
      getCurrentBalanceCountervalueChangeForTable,
    ],
  );

  return <AssetsTablePortsProvider value={ports}>{children}</AssetsTablePortsProvider>;
}
