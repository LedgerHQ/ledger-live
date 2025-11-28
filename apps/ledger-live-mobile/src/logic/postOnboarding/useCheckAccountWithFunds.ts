import { useCheckAccountWithFundsAction } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useCompleteActionCallback } from "./useCompleteAction";

const useCheckAccountWithFunds = () => {
  const completeAction = useCompleteActionCallback();
  const handleAccountsUpdate = useCheckAccountWithFundsAction(completeAction);

  return handleAccountsUpdate;
};

export default useCheckAccountWithFunds;
