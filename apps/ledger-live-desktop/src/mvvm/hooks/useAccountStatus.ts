import { useState, useEffect } from "react";
import { useSelector } from "./redux";
import { hasAccountsSelector, accountsSelector } from "~/renderer/reducers/accounts";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";

/**
 * Hook to determine the status of user accounts and funds.
 * @returns Object containing `hasAccount` (whether accounts exist) and `hasFunds` (whether accounts exist and have funds)
 */
export const useAccountStatus = () => {
  const hasAccount = useSelector(hasAccountsSelector);
  const accounts = useSelector(accountsSelector);
  const [areAccountsEmpty, setAreAccountsEmpty] = useState(true);

  useEffect(() => {
    if (accounts.length === 0) {
      setAreAccountsEmpty(true);
      return;
    }
    Promise.all(accounts.map(isAccountEmpty)).then(results =>
      setAreAccountsEmpty(results.every(Boolean)),
    );
  }, [accounts]);

  const hasFunds = !areAccountsEmpty && hasAccount;
  return {
    hasAccount,
    hasFunds,
  };
};
