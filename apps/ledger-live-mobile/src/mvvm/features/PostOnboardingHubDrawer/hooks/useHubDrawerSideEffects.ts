import { useEffect } from "react";
import { clearPostOnboardingLastActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";
import { useDispatch } from "~/context/hooks";
import { setHasBeenRedirectedToPostOnboarding, setIsPostOnboardingFlow } from "~/actions/settings";

type Args = Readonly<{
  isOpen: boolean;
  isActivationDrawerVisible: boolean;
}>;

export function useHubDrawerSideEffects({ isOpen, isActivationDrawerVisible }: Args) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isOpen) return;
    dispatch(clearPostOnboardingLastActionCompleted());
    dispatch(setHasBeenRedirectedToPostOnboarding(true));
  }, [dispatch, isOpen]);

  useEffect(() => {
    if (isOpen && isActivationDrawerVisible) {
      dispatch(setIsPostOnboardingFlow(true));
    }
  }, [dispatch, isActivationDrawerVisible, isOpen]);
}
