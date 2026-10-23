import { useCallback } from "react";
import {
  completeOnboarding,
  setHasBeenRedirectedToPostOnboarding,
  setHasBeenUpsoldProtect,
  setIsReborn,
  setOnboardingHasDevice,
  setReadOnlyMode,
} from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";

type Dispatch = ReturnType<typeof useDispatch>;

export function completeSeededOnboarding(
  dispatch: Dispatch,
  wasReadOnlyAtEntry: boolean,
  hasCompletedOnboarding: boolean,
) {
  dispatch(setIsReborn(false));
  if (!hasCompletedOnboarding) {
    dispatch(setOnboardingHasDevice(true));
  }
  dispatch(completeOnboarding());
  dispatch(setReadOnlyMode(false));
  dispatch(setHasBeenUpsoldProtect(false));
  if (wasReadOnlyAtEntry) {
    dispatch(setHasBeenRedirectedToPostOnboarding(false));
  }
}

export function useCompleteSeededOnboarding(wasReadOnlyAtEntry: boolean) {
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  return useCallback(
    () => completeSeededOnboarding(dispatch, wasReadOnlyAtEntry, hasCompletedOnboarding),
    [dispatch, hasCompletedOnboarding, wasReadOnlyAtEntry],
  );
}
