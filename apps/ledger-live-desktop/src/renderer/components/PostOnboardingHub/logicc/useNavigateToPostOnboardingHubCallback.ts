import { useCallback } from "react";
import { useHistory } from "react-router-dom";

export function useNavigateToPostOnboardingHubCallback() {
  const history = useHistory();

  return useCallback(() => {
    history.push("/post-onboarding");
  }, [history]);
}
