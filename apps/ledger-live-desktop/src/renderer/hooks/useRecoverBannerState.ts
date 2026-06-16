import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  selectRecoverStateByProtectId,
  setDisplayBanner,
  setRecoverState,
} from "~/renderer/reducers/recoverState";
import { getStoreValue, setStoreValue } from "~/renderer/store";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";

export type RecoverBannerState = {
  subscriptionState: LedgerRecoverSubscriptionStateEnum;
  displayBanner: boolean;
};

export const DEFAULT_PROTECT_ID = "protect-prod";

const DISPLAY_BANNER_STORAGE_KEY = "DISPLAY_BANNER";
const SUBSCRIPTION_STATE_STORAGE_KEY = "SUBSCRIPTION_STATE";

export function useRecoverBannerState(protectId: string): {
  data: RecoverBannerState;
  dismissBanner: () => void;
} {
  const dispatch = useDispatch();
  const data = useSelector(selectRecoverStateByProtectId(protectId));

  useEffect(() => {
    try {
      const storedSubscriptionState = getStoreValue<LedgerRecoverSubscriptionStateEnum>(
        SUBSCRIPTION_STATE_STORAGE_KEY,
        protectId,
      );
      const storedDisplayBanner = getStoreValue<string>(DISPLAY_BANNER_STORAGE_KEY, protectId);

      if (storedSubscriptionState !== undefined) {
        dispatch(setRecoverState({ protectId, subscriptionState: storedSubscriptionState }));
      }
      if (storedDisplayBanner === "false") {
        dispatch(setDisplayBanner({ protectId, displayBanner: false }));
      }
    } catch {
      // Banner defaults to visible if storage read fails.
    }
  }, [dispatch, protectId]);

  const dismissBanner = useCallback(() => {
    dispatch(setDisplayBanner({ protectId, displayBanner: false }));
    try {
      setStoreValue(DISPLAY_BANNER_STORAGE_KEY, "false", protectId);
    } catch {
      // Ignore persistence failures; dismissal is already reflected in Redux for this session.
    }
  }, [dispatch, protectId]);

  return { data, dismissBanner };
}
