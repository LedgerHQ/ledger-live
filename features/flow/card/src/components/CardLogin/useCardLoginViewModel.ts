import { useCallback, useState } from "react";
import { usePreAuthMutation } from "@domain/api-pay-card";
import type { PayCardProvider } from "@domain/entity-pay-card";
import type { CardLoginViewProps, OpenHostedLogin } from "./types";

export type UseCardLoginViewModelArgs = {
  readonly openHostedLogin?: OpenHostedLogin;
  readonly provider?: PayCardProvider;
};

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
}: UseCardLoginViewModelArgs = {}): CardLoginViewProps {
  const [preAuth, { isLoading: isPreAuthLoading }] = usePreAuthMutation();
  const [isOpeningHostedLogin, setIsOpeningHostedLogin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onLoginPress = useCallback(() => {
    setErrorMessage(null);

    void (async () => {
      setIsOpeningHostedLogin(true);
      try {
        const { loginUrl } = await preAuth({ provider }).unwrap();

        if (!openHostedLogin) {
          throw new Error("Hosted login opener is unavailable");
        }

        await openHostedLogin(loginUrl);
      } catch (error) {
        setErrorMessage(getLoginErrorMessage(error));
      } finally {
        setIsOpeningHostedLogin(false);
      }
    })();
  }, [openHostedLogin, preAuth, provider]);

  return {
    loginLabel: "Login",
    isLoading: isPreAuthLoading || isOpeningHostedLogin,
    errorMessage,
    onLoginPress,
  };
}
