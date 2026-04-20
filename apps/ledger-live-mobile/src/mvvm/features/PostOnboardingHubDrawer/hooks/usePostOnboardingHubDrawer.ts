import { useDispatch, useSelector } from "~/context/hooks";
import {
  closePostOnboardingHubDrawer as closeAction,
  openPostOnboardingHubDrawer as openAction,
  postOnboardingHubDrawerSelector,
} from "~/reducers/postOnboardingHubDrawer";

export function usePostOnboardingHubDrawer() {
  const dispatch = useDispatch();
  const { isOpen } = useSelector(postOnboardingHubDrawerSelector);

  const openPostOnboardingHubDrawer = () => {
    dispatch(openAction());
  };

  const closePostOnboardingHubDrawer = () => {
    dispatch(closeAction());
  };

  return {
    isPostOnboardingHubDrawerOpen: isOpen,
    openPostOnboardingHubDrawer,
    closePostOnboardingHubDrawer,
  };
}
