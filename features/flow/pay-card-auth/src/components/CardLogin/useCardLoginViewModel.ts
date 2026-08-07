import { useCallback, useState } from "react";
import { useInitiateAuthorizeMutation } from "@domain/api-card-management";
import type { PayCardAuthorizeInitiateRequest } from "@domain/api-card-management";
import type { CardLoginProps, CardLoginViewProps } from "./types";

const PLACEHOLDER_AUTHORIZE_REQUEST: PayCardAuthorizeInitiateRequest = {
  clientId: "",
  redirectUri: "",
  state: "",
  codeChallenge: "",
};

function getSecureHostedLoginUrl(loginUrl: string): string {
  const url = new URL(loginUrl);
  if (url.protocol !== "https:") {
    throw new Error("Unable to start login");
  }
  return loginUrl;
}

// An RTK rejection is a `FetchBaseQueryError` carrying the raw response, which must not be rendered.
function getLoginErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to start login";
}

export function useCardLoginViewModel({ openHostedLogin }: CardLoginProps): CardLoginViewProps {
  const [initiateAuthorize, { isLoading: isInitiateAuthorizeLoading }] =
    useInitiateAuthorizeMutation();
  const [isOpeningHostedLogin, setIsOpeningHostedLogin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onLoginPress = useCallback(() => {
    setErrorMessage(null);

    void (async () => {
      setIsOpeningHostedLogin(true);
      try {
        const { url } = await initiateAuthorize(PLACEHOLDER_AUTHORIZE_REQUEST).unwrap();
        await openHostedLogin(getSecureHostedLoginUrl(url));
      } catch (error) {
        setErrorMessage(getLoginErrorMessage(error));
      } finally {
        setIsOpeningHostedLogin(false);
      }
    })();
  }, [openHostedLogin, initiateAuthorize]);

  return {
    title: "Card",
    description: "Log in to access your Ledger Card",
    loginLabel: "Login",
    isLoading: isInitiateAuthorizeLoading || isOpeningHostedLogin,
    errorMessage,
    onLoginPress,
  };
}
