import { useCheckAccountWithFundsAction } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useCompleteActionCallback } from "./useCompleteAction";
import { Account } from "@ledgerhq/types-live";

const useCheckAccountWithFunds = (): ((accounts: Account[]) => void) => {
  const completeAction = useCompleteActionCallback();
  const handleAccountsUpdate = useCheckAccountWithFundsAction(completeAction);

  return handleAccountsUpdate;
};

export default useCheckAccountWithFunds;
