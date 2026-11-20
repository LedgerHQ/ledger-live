import { useCallback, useMemo } from "react";
import type { Currency } from "@domain/entity-currency";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../../account";
import { useAcceptedCurrency } from "../../../modularDrawer/hooks/useAcceptedCurrency";
import { PERPS_UI_USE_CASE } from "../../ModularDrawer/uiUseCase";
import { pickDefaultDepositAccount } from "./defaultAccount";

/** The funding account preselected in the perps deposit form, among those its picker offers. */
export function useDefaultDepositAccount({
  accounts,
  receiverAccount,
  counterValueCurrency,
}: {
  accounts: AccountLike[];
  receiverAccount: AccountLike;
  counterValueCurrency: Currency;
}): AccountLike | undefined {
  const isAcceptedCurrency = useAcceptedCurrency({ flow: PERPS_UI_USE_CASE.fund });
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });

  const isEligible = useCallback(
    (account: AccountLike) =>
      account.id !== receiverAccount.id && isAcceptedCurrency(getAccountCurrency(account)),
    [isAcceptedCurrency, receiverAccount.id],
  );

  const getFiatBalance = useCallback(
    (account: AccountLike) =>
      calculateCountervalue(getAccountCurrency(account), account.spendableBalance) ?? undefined,
    [calculateCountervalue],
  );

  return useMemo(
    () => pickDefaultDepositAccount({ accounts, isEligible, getFiatBalance }),
    [accounts, getFiatBalance, isEligible],
  );
}
