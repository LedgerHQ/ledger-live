import { useCallback, useState } from "react";
import { useInitiateAuthorizeMutation } from "../../state";
import type { PayCardAuthorizeInitiateRequest } from "../../state";
import type { CardLoginProps, CardLoginViewProps } from "./types";

/**
 * TODO(LIVE-34769): the OAuth orchestration that produces these — a random `state`, a PKCE
 * verifier/challenge pair and the registered redirect URI — is the next ticket, as is the client id
 * that has to come from configuration. Login therefore cannot complete yet; sending the real request
 * shape now keeps this call site typed against the contract it will use.
 */
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
