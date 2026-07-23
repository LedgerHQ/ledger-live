import { useCallback, useMemo } from "react";
import { usePreAuthMutation } from "@domain/api-pay-card";

export type CardScreenViewModel = {
  readonly description: string;
  readonly isPreAuthLoading: boolean;
  readonly onPreAuthPress: () => void;
  readonly preAuthButtonLabel: string;
  readonly preAuthResult: string | null;
  readonly title: string;
};

function getPreAuthErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "error" in error) {
    const message = error.error;
    if (typeof message === "string") {
      return message;
    }
  }

  return "Unable to start Card auth";
}

export function useCardScreenViewModel(): CardScreenViewModel {
  const [preAuth, { data, error, isLoading }] = usePreAuthMutation();

  const onPreAuthPress = useCallback(() => {
    void preAuth({ provider: "baanx" });
  }, [preAuth]);

  const preAuthResult = useMemo(() => {
    if (data) {
      return data.loginUrl;
    }

    if (error) {
      return getPreAuthErrorMessage(error);
    }

    return null;
  }, [data, error]);

  return {
    title: "Card playground",
    description: "Card flow scaffold by design system",
    preAuthButtonLabel: isLoading ? "Starting auth..." : "Get Login URL",
    isPreAuthLoading: isLoading,
    onPreAuthPress,
    preAuthResult,
  };
}
