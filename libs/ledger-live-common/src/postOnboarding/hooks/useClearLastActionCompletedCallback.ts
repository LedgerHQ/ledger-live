import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { clearPostOnboardingLastActionCompleted } from "../actions";

export function useClearLastActionCompletedCallback(): () => void {
  const dispatch = useDispatch();
  return useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);
}
