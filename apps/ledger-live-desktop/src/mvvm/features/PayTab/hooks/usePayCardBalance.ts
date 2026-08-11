import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import type { PayCardBalanceData, PayCardBalanceStatus } from "@features/flow-pay-card-balance";
import { selectPayCardBalanceFilter } from "@domain/entity-pay-card";
import { useSelector } from "LLD/hooks/redux";
import { useCategorizedAssetsFromPortfolio } from "LLD/hooks/useCategorizedAssets";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";

export function usePayCardBalance(): PayCardBalanceData {
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const filter = useSelector(selectPayCardBalanceFilter);

  const { categorizedAssets, isLoadingStablecoinTickers, isStablecoinTickersError } =
    useCategorizedAssetsFromPortfolio();

  const stableBalance = useMemo(
    () => categorizedAssets.stablecoins.reduce((total, { value }) => total + value, 0),
    [categorizedAssets.stablecoins],
  );

  const unit = counterValueCurrency.units[0];

  const formatCountervalue = useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(unit, new BigNumber(value), {
        locale,
        showCode: true,
      }),
    [unit, locale],
  );

  const status: PayCardBalanceStatus = isStablecoinTickersError
    ? "error"
    : isLoadingStablecoinTickers
      ? "loading"
      : "ready";

  return useMemo(
    () => ({ status, stableBalance, filter, formatCountervalue }),
    [status, stableBalance, filter, formatCountervalue],
  );
}
