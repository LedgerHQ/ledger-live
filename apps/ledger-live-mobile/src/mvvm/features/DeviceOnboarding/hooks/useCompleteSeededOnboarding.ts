import { useCallback } from "react";
import {
  completeOnboarding,
  setHasBeenRedirectedToPostOnboarding,
  setReadOnlyMode,
} from "~/actions/settings";
import { useDispatch } from "~/context/hooks";

type Dispatch = ReturnType<typeof useDispatch>;

export function completeSeededOnboarding(dispatch: Dispatch, wasReadOnlyAtEntry: boolean) {
  dispatch(completeOnboarding());
  dispatch(setReadOnlyMode(false));
  if (wasReadOnlyAtEntry) {
    dispatch(setHasBeenRedirectedToPostOnboarding(false));
  }
}

export function useCompleteSeededOnboarding(wasReadOnlyAtEntry: boolean) {
  const dispatch = useDispatch();

  return useCallback(
    () => completeSeededOnboarding(dispatch, wasReadOnlyAtEntry),
    [dispatch, wasReadOnlyAtEntry],
  );
}
