import { useSelector } from "./redux";
import { hasAccountsSelector } from "~/renderer/reducers/accounts";
import { useAreAccountsEmpty } from "./useAreAccountsEmpty";

/**
 * Hook to determine the status of user accounts and funds.
 * @returns Object containing `hasAccount` (whether accounts exist) and `hasFunds` (whether accounts exist and have funds)
 */
export const useAccountStatus = () => {
  const hasAccount = useSelector(hasAccountsSelector);
  const areAccountsEmpty = useAreAccountsEmpty();
  const hasFunds = !areAccountsEmpty && hasAccount;

  return {
    hasAccount,
    hasFunds,
  };
};
