import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import type { AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { useMaybeAccountUnit } from "LLM/hooks/useAccountUnit";
import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";

type FormattedAccountBalance = {
  formattedBalance: string | undefined;
  formattedCounterValue: string | undefined;
};

export function useFormattedAccountBalance(
  account: AccountLike | undefined,
): FormattedAccountBalance {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const unit = useMaybeAccountUnit(account);
  const accountCurrency = account ? getAccountCurrency(account) : undefined;

  const balanceValue = useMemo(() => {
    if (!account) return 0;
    return account.balance.toNumber();
  }, [account]);

  const counterValue = useCalculate({
    from: accountCurrency ?? counterValueCurrency,
    to: counterValueCurrency,
    value: balanceValue,
    disableRounding: true,
  });

  const formattedCounterValue = useMemo(() => {
    if (typeof counterValue !== "number" || !account || !unit) {
      return undefined;
    }
    return formatCurrencyUnit(counterValueCurrency.units[0], new BigNumber(counterValue), {
      showCode: true,
      discreet,
    });
  }, [counterValue, counterValueCurrency, account, unit, discreet]);

  const formattedBalance = useMemo(() => {
    if (!account || !unit) return undefined;
    return formatCurrencyUnit(unit, account.balance, {
      showCode: true,
      discreet,
    });
  }, [account, unit, discreet]);

  return { formattedBalance, formattedCounterValue };
}
