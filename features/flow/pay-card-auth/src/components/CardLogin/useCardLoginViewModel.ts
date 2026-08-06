import { useCallback, useState } from "react";
import { usePreAuthMutation } from "../../state";
import type { CardLoginProps, CardLoginViewProps } from "./types";

function getSecureHostedLoginUrl(loginUrl: string): string {
  const url = new URL(loginUrl);
  if (url.protocol !== "https:") {
    throw new Error("Unable to start login");
  }
  return url.toString();
}

// Only genuine `Error` messages reach the user. RTK rejections carry internal strings such as the
// base query's `CUSTOM_ERROR` text, which must not be rendered.
function getLoginErrorMessage(error: unknown): string {
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
        await openHostedLogin(getSecureHostedLoginUrl(loginUrl));
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
