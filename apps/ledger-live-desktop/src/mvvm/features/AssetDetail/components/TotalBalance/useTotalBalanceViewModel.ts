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
  const fiatAvailable = totalCountervalue != null;

  const fiatParts = useMemo(() => {
    if (!fiatAvailable) return undefined;

    const fragment = formatCurrencyUnitFragment(fiatUnit, new BigNumber(totalCountervalue), {
      locale,
      discreet,
      showCode: true,
      disableRounding: true,
      showAllDigits: true,
    });
    return parseCurrencyUnitFragment(fragment);
  }, [discreet, fiatAvailable, fiatUnit, locale, totalCountervalue]);

  const totalBalanceLabel = t("assetDetails.totalBalance");
  const fiatAriaLabel = !fiatAvailable
    ? "-"
    : discreet
      ? totalBalanceLabel
      : formatFiatBalanceForDisplay(fiatUnit, totalCountervalue, { locale });

  return {
    totalBalanceLabel,
    fiatAriaLabel,
    fiatAvailable,
    prefixSymbol: fiatParts?.prefixSymbol ?? null,
    suffixSymbol: fiatParts?.suffixSymbol ?? null,
    hasDecimals: fiatParts?.hasDecimals ?? false,
    integerPart: fiatParts?.integerPart ?? "",
    decimalSeparator: fiatParts?.decimalSeparator ?? "",
    decimalPart: fiatParts?.decimalPart,
    amount,
    cryptoUnit,
  };
}
