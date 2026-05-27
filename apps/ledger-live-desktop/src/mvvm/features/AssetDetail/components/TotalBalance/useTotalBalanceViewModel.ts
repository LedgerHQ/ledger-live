import { useCallback } from "react";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";

export function useTotalBalanceViewModel(distributionItem: DistributionItem) {
  const { t } = useTranslation();
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const fiatUnit = fiatCurrency.units[0];
  const { currency: assetCurrency, amount, countervalue: totalCountervalue } = distributionItem;
  const cryptoUnit = assetCurrency.units[0];

  const fiatFormatter = useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(fiatUnit, new BigNumber(value), {
        locale,
        discreet,
        showCode: true,
      }),
    [fiatUnit, locale, discreet],
  );

  return {
    totalBalanceLabel: t("assetDetails.totalBalance"),
    fiatDisplayValue: totalCountervalue ?? 0,
    fiatFormatter,
    hidden: discreet,
    amount,
    cryptoUnit,
  };
}
