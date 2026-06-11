import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import {
  selectRecoverStateByProtectId,
  setDisplayBanner,
  setRecoverState,
} from "~/reducers/recoverState";
import { getStoreValue, setStoreValue } from "~/store";

export type RecoverBannerState = {
  subscriptionState: LedgerRecoverSubscriptionStateEnum;
  displayBanner: boolean;
};

const DISPLAY_BANNER_STORAGE_KEY = "DISPLAY_BANNER";
const SUBSCRIPTION_STATE_STORAGE_KEY = "SUBSCRIPTION_STATE";

function useRecoverBannerState(protectId: string): {
  data: RecoverBannerState;
  dismissBanner: () => void;
} {
  const dispatch = useDispatch();
  const data = useSelector(selectRecoverStateByProtectId(protectId));

  useEffect(() => {
    const rehydrate = async () => {
      try {
        const [storedSubscriptionState, storedDisplayBanner] = await Promise.all([
          getStoreValue<LedgerRecoverSubscriptionStateEnum>(
            SUBSCRIPTION_STATE_STORAGE_KEY,
            protectId,
          ),
          getStoreValue<string>(DISPLAY_BANNER_STORAGE_KEY, protectId),
        ]);

        if (storedSubscriptionState !== undefined) {
          dispatch(setRecoverState({ protectId, subscriptionState: storedSubscriptionState }));
        }
        if (storedDisplayBanner === "false") {
          dispatch(setDisplayBanner({ protectId, displayBanner: false }));
        }
      } catch {
        // banner defaults to visible if storage read fails
      }
    };
    rehydrate();
  }, [dispatch, protectId]);

  const dismissBanner = useCallback(() => {
    dispatch(setDisplayBanner({ protectId, displayBanner: false }));
    const persist = async () => {
      try {
        await setStoreValue(DISPLAY_BANNER_STORAGE_KEY, "false", protectId);
      } catch {
        // ignore - dismiss already reflected in Redux for this session
      }
    };
    persist();
  }, [dispatch, protectId]);

  return { data, dismissBanner };
}

export default useRecoverBannerState;
