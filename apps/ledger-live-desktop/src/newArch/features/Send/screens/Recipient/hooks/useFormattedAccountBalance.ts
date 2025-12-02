import { useMemo } from "react";
import { useSelector } from "react-redux";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";

type FormattedAccountBalance = {
  formattedBalance: string | undefined;
  formattedCounterValue: string | undefined;
};

/**
 * Hook to format account balance and counter value
 * Handles both defined and undefined accounts
 */
export function useFormattedAccountBalance(
  account: Account | undefined,
): FormattedAccountBalance {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const unit = useMaybeAccountUnit(account);
  const accountCurrency = account ? getAccountCurrency(account) : null;

  const balanceValue = useMemo(() => {
    if (!account) return 0;
    return account.balance.toNumber();
  }, [account]);

  const counterValue = useCalculate({
    from: accountCurrency ?? ({} as CryptoCurrency),
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
    });
  }, [counterValue, counterValueCurrency, account, unit]);

  const formattedBalance = useMemo(() => {
    if (!account || !unit) return undefined;
    return formatCurrencyUnit(unit, account.balance, {
      showCode: true,
    });
  }, [account, unit]);

  return { formattedBalance, formattedCounterValue };
}
