import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  localeSelector,
  discreetModeSelector,
} from "~/renderer/reducers/settings";

type AggregatedAccountValueCellProps = {
  readonly aggregatedCountervalue: BigNumber;
};

export function AggregatedAccountValueCell({
  aggregatedCountervalue,
}: AggregatedAccountValueCellProps) {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);

  const formattedValue = formatCurrencyUnit(counterValueCurrency.units[0], aggregatedCountervalue, {
    showCode: true,
    locale,
    discreet,
  });

  return <TableCellContent align="end" title={formattedValue} />;
}
