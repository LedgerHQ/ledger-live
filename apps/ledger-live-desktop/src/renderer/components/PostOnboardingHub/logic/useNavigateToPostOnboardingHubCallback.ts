import { useCallback } from "react";
import { useNavigate } from "react-router";

export function useNavigateToPostOnboardingHubCallback() {
  const navigate = useNavigate();

  return useCallback(() => {
    navigate("/post-onboarding");
  }, [navigate]);
}
