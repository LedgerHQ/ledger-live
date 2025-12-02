import { useMemo } from "react";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import type { Account } from "@ledgerhq/types-live";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";

type FormattedAccountBalance = {
  formattedBalance: string;
  formattedCounterValue: string | undefined;
};

export function useFormattedAccountBalance(account: Account): FormattedAccountBalance {
  const unit = useAccountUnit(account);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const accountCurrency = getAccountCurrency(account);

  const formattedBalance = formatCurrencyUnit(unit, account.balance, {
    showCode: true,
  });

  const balanceValue = account.balance.toNumber();

  const counterValue = useCalculate({
    from: accountCurrency,
    to: counterValueCurrency,
    value: balanceValue,
    disableRounding: true,
  });

  const formattedCounterValue = useMemo(() => {
    if (typeof counterValue !== "number") {
      return undefined;
    }
    return formatCurrencyUnit(counterValueCurrency.units[0], new BigNumber(counterValue), {
      showCode: true,
    });
  }, [counterValue, counterValueCurrency]);

  return { formattedBalance, formattedCounterValue };
}
