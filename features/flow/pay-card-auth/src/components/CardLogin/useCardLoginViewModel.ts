import { useCallback, useState } from "react";
import { usePreAuthMutation } from "@domain/api-pay-card";
import type { CardLoginProps, CardLoginViewProps } from "./types";

function getLoginErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "error" in error) {
    const message = error.error;
    if (typeof message === "string") {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to start login";
}

export function useCardLoginViewModel({
  openHostedLogin,
  provider = "baanx",
}: CardLoginProps): CardLoginViewProps {
  const [preAuth, { isLoading: isPreAuthLoading }] = usePreAuthMutation();
  const [isOpeningHostedLogin, setIsOpeningHostedLogin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onLoginPress = useCallback(() => {
    setErrorMessage(null);

    void (async () => {
      setIsOpeningHostedLogin(true);
      try {
        const { loginUrl } = await preAuth({ provider }).unwrap();
        await openHostedLogin(loginUrl);
      } catch (error) {
        setErrorMessage(getLoginErrorMessage(error));
      } finally {
        setIsOpeningHostedLogin(false);
      }
    })();
  }, [openHostedLogin, preAuth, provider]);

  return {
    title: "Card",
    description: "Log in to access your Ledger Card",
    loginLabel: "Login",
    isLoading: isPreAuthLoading || isOpeningHostedLogin,
    errorMessage,
    onLoginPress,
  };
}
