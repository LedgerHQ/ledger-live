import { useMemo } from "react";
import { useSelector } from "LLD/hooks/redux";
import { localeSelector, counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { useMaybeAccountUnit } from "~/renderer/hooks/useAccountUnit";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { AccountLike } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type { SendAmountDisplayMode } from "@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext";

export function useAvailableBalance(
  account?: AccountLike | null,
  displayMode: SendAmountDisplayMode = "fiat",
) {
  const locale = useSelector(localeSelector);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const unit = useMaybeAccountUnit(account ?? undefined);

  const accountCurrency = useMemo(
    () => (account ? getAccountCurrency(account) : undefined),
    [account],
  );

  const counterValue = useCalculate({
    from: accountCurrency ?? counterValueCurrency,
    to: counterValueCurrency,
    value: account?.spendableBalance.toNumber() ?? 0,
    disableRounding: true,
  });

  const availableBalanceFormatted = useMemo(() => {
    if (!account || !unit) return "";
    return formatCurrencyUnit(unit, account.spendableBalance, {
      showCode: true,
      disableRounding: false,
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
    if (displayMode === "crypto") return availableBalanceFormatted;
    return counterValueFormatted || availableBalanceFormatted || "";
  }, [account, displayMode, counterValueFormatted, availableBalanceFormatted]);
}
