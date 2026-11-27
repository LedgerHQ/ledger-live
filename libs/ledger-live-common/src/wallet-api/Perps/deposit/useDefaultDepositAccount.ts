import { useCallback, useMemo } from "react";
import type { CryptoOrTokenCurrency, Currency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import useEnv from "@features/platform-env";
import { useCalculateCountervalueCallback } from "@features/platform-market-countervalues";
import type { AccountLike } from "@ledgerhq/types-live";
import { getAccountCurrency } from "../../../account";
import { useAcceptedCurrency } from "../../../modularDrawer/hooks/useAcceptedCurrency";
import { PERPS_UI_USE_CASE } from "../../ModularDrawer/uiUseCase";
import { pickDefaultDepositAccount } from "./defaultAccount";

/** Default perps deposit funding account, among those the funding picker offers. */
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
  const devMode = useEnv("MANAGER_DEV_MODE");
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });

  const isEligible = useCallback(
    (account: AccountLike) => {
      if (account.id === receiverAccount.id) return false;
      const currency = getAccountCurrency(account);
      if (!devMode && isTestNetwork(currency)) return false;
      return isAcceptedCurrency(currency);
    },
    [devMode, isAcceptedCurrency, receiverAccount.id],
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

function isTestNetwork(currency: CryptoOrTokenCurrency): boolean {
  const network =
    currency.type === "TokenCurrency" ? getCryptoCurrencyById(currency.parentCurrencyId) : currency;
  return Boolean(network.isTestnetFor);
}
