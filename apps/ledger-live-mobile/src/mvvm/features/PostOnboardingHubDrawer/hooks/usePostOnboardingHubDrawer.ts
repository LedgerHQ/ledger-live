import { useCallback } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  closePostOnboardingHubDrawer as closeAction,
  openPostOnboardingHubDrawer as openAction,
  postOnboardingHubDrawerSelector,
} from "~/reducers/postOnboardingHubDrawer";

export function usePostOnboardingHubDrawer() {
  const dispatch = useDispatch();
  const { isOpen } = useSelector(postOnboardingHubDrawerSelector);

  const openPostOnboardingHubDrawer = useCallback(() => {
    dispatch(openAction());
  }, [dispatch]);

  const closePostOnboardingHubDrawer = useCallback(() => {
    dispatch(closeAction());
  }, [dispatch]);

  return {
    isPostOnboardingHubDrawerOpen: isOpen,
    openPostOnboardingHubDrawer,
    closePostOnboardingHubDrawer,
  };
}
