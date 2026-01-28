import { useSelector } from "./redux";
import { areAccountsEmptySelector, hasAccountsSelector } from "~/renderer/reducers/accounts";

/**
 * Hook to determine the status of user accounts and funds.
 * @returns Object containing `hasAccount` (whether accounts exist) and `hasFunds` (whether accounts exist and have funds)
 */
export const useAccountStatus = () => {
  const hasAccount = useSelector(hasAccountsSelector);
  const areAccountsEmpty = useSelector(areAccountsEmptySelector);
  const hasFunds = !areAccountsEmpty && hasAccount;

  return {
    hasAccount,
    hasFunds,
  };
};
