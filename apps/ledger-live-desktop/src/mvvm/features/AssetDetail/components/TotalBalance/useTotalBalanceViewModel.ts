import { useMemo } from "react";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { DistributionItem } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { formatFiatBalanceForDisplay } from "LLD/features/AssetDetail/utils/formatFiatBalanceForDisplay";
import { parseCurrencyUnitFragment } from "LLD/features/AssetDetail/utils/parseCurrencyUnitFragment";
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
  const fiatValue = totalCountervalue ?? 0;

  const fiatParts = useMemo(() => {
    const fragment = formatCurrencyUnitFragment(fiatUnit, new BigNumber(fiatValue), {
      locale,
      discreet,
      showCode: true,
      disableRounding: true,
      showAllDigits: true,
    });
    return parseCurrencyUnitFragment(fragment);
  }, [discreet, fiatUnit, fiatValue, locale]);

  const totalBalanceLabel = t("assetDetails.totalBalance");
  const fiatAriaLabel = discreet
    ? totalBalanceLabel
    : formatFiatBalanceForDisplay(fiatUnit, fiatValue, { locale });

  return {
    totalBalanceLabel,
    fiatAriaLabel,
    ...fiatParts,
    amount,
    cryptoUnit,
  };
}
