import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { clearPostOnboardingLastActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";
import { setDrawer } from "~/renderer/drawers/Provider";
import PostOnboardingHubContent from "~/renderer/components/PostOnboardingHub/PostOnboardingHubContent";

function useOpenPostOnboardingDrawerCallback() {
  const dispatch = useDispatch();

  return useCallback(() => {
    setDrawer(
      PostOnboardingHubContent,
      {},
      {
        onRequestClose: () => {
          setDrawer();
          dispatch(clearPostOnboardingLastActionCompleted());
        },
      },
    );
  }, [dispatch]);
}

export default useOpenPostOnboardingDrawerCallback;
