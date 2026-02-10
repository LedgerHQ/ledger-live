import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { useLocale } from "~/context/Locale";

export function useAvailableBalance(account?: AccountLike | null) {
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const unit = useMaybeAccountUnit(account ?? undefined);

  const accountCurrency = useMemo(
    () => (account ? getAccountCurrency(account) : undefined),
    [account],
  );

  const counterValue = useCalculate({
    from: accountCurrency ?? counterValueCurrency,
    to: counterValueCurrency,
    value: account?.balance.toNumber() ?? 0,
    disableRounding: true,
  });

  const availableBalanceFormatted = useMemo(() => {
    if (!account || !unit) return "";
    return formatCurrencyUnit(unit, account.balance, {
      showCode: true,
      locale,
    });
  }, [account, unit, locale]);

  const counterValueFormatted = useMemo(() => {
    if (typeof counterValue !== "number" || !counterValueCurrency) return "";
    return formatCurrencyUnit(counterValueCurrency.units[0], new BigNumber(counterValue), {
      showCode: true,
      locale,
    });
  }, [counterValue, counterValueCurrency, locale]);

  return useMemo(() => {
    if (!account) return "";
    return counterValueFormatted || availableBalanceFormatted || "";
  }, [account, counterValueFormatted, availableBalanceFormatted]);
}
