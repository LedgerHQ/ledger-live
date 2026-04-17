import React from "react";
import { TableCellContent } from "@ledgerhq/lumen-ui-react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  localeSelector,
  discreetModeSelector,
} from "~/renderer/reducers/settings";

type AggregatedAccountValueCellProps = {
  readonly aggregatedCountervalue: BigNumber;
  readonly assetsCount: number;
};

export function AggregatedAccountValueCell({
  aggregatedCountervalue,
  assetsCount,
}: AggregatedAccountValueCellProps) {
  const { t } = useTranslation();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);

  const formattedValue = formatCurrencyUnit(counterValueCurrency.units[0], aggregatedCountervalue, {
    showCode: true,
    locale,
    discreet,
  });

  return (
    <TableCellContent
      align="end"
      title={formattedValue}
      description={t("cryptoAddresses.table.assetCount", { count: assetsCount })}
    />
  );
}
