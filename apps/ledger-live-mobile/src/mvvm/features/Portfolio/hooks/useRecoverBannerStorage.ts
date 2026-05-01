import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { selectRecoverStateByProtectId, setDisplayBanner } from "~/reducers/recoverState";

export type RecoverBannerState = {
  subscriptionState: LedgerRecoverSubscriptionStateEnum;
  displayBanner: boolean;
};

function useRecoverBannerStorage(protectId: string): {
  data: RecoverBannerState;
  dismissBanner: () => void;
} {
  const dispatch = useDispatch();
  const data = useSelector(selectRecoverStateByProtectId(protectId));

  const dismissBanner = useCallback(() => {
    dispatch(setDisplayBanner({ protectId, displayBanner: false }));
  }, [dispatch, protectId]);

  return { data, dismissBanner };
}

export default useRecoverBannerStorage;
