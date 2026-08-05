import { useCallback } from "react";
import { Linking } from "react-native";
import type { OpenHostedLogin } from "@features/flow-pay-card-auth";
import { useNavigationBarHeights } from "LLM/hooks/useNavigationBarHeights";

export function usePayTabViewModel() {
  const { top } = useNavigationBarHeights();
  const openHostedLogin: OpenHostedLogin = useCallback(loginUrl => Linking.openURL(loginUrl), []);

  return { top, openHostedLogin };
}
