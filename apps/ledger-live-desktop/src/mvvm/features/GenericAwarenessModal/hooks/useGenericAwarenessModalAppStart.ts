import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import { isGenericAwarenessModalContentCardReady } from "@ledgerhq/live-common/genericAwarenessModal";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";
import { selectGenericAwarenessModalAppStartContentCard } from "~/renderer/reducers/genericAwarenessModalSlice";
import {
  openGenericAwarenessModalDialog,
  selectIsGenericAwarenessModalOpen,
} from "../genericAwarenessModalDialog";

/**
 * Opens the Generic Awareness Modal on app launch when an APP_START campaign exists in the store.
 * Waits for Braze (or dev mocks) to deliver a complete APP_START campaign before opening once per session.
 */
const useGenericAwarenessModalAppStart = (): void => {
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const isFeatureEnabled = useFeature("lwdGenericAwarenessModal")?.enabled === true;
  const appStartContentCard = useSelector(selectGenericAwarenessModalAppStartContentCard);
  const isModalOpen = useSelector(selectIsGenericAwarenessModalOpen);
  const hasOpenedAppStartModalRef = useRef(false);

  useEffect(() => {
    if (hasOpenedAppStartModalRef.current) {
      return;
    }
    if (!hasCompletedOnboarding || !isFeatureEnabled) {
      return;
    }
    if (!appStartContentCard || !isGenericAwarenessModalContentCardReady(appStartContentCard)) {
      return;
    }
    if (isModalOpen) {
      return;
    }

    hasOpenedAppStartModalRef.current = true;
    dispatch(openGenericAwarenessModalDialog());
  }, [appStartContentCard, dispatch, hasCompletedOnboarding, isFeatureEnabled, isModalOpen]);
};

export default useGenericAwarenessModalAppStart;
