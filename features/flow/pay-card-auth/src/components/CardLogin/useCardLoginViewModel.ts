import { useCallback, useState } from "react";
import { useInitiateAuthorizeMutation } from "@domain/api-card-management";
import { createAuthorizeAttempt } from "../../state/authorizeAttempt";
import type { CardLoginViewModelParams, CardLoginViewProps } from "./types";

export function useCardLoginViewModel({
  openHostedLogin,
  oauthConfig,
}: CardLoginViewModelParams): CardLoginViewProps {
  const [initiateAuthorize, { isLoading: isInitiateAuthorizeLoading }] =
    useInitiateAuthorizeMutation();
  const [isOpeningHostedLogin, setIsOpeningHostedLogin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onLoginPress = useCallback(() => {
    setErrorMessage(null);

    void (async () => {
      setIsOpeningHostedLogin(true);
      try {
        const { state, codeChallenge } = await createAuthorizeAttempt();

        const { url, redirectUri } = await initiateAuthorize({
          clientId: oauthConfig.clientId,
          redirectUri: oauthConfig.redirectUri,
          state,
          codeChallenge,
        }).unwrap();

        await openHostedLogin(url, redirectUri);
      } catch (error) {
        setErrorMessage(
          error instanceof Error && error.message ? error.message : "Unable to start login",
        );
      } finally {
        setIsOpeningHostedLogin(false);
      }
    })();
  }, [openHostedLogin, initiateAuthorize, oauthConfig.clientId, oauthConfig.redirectUri]);

  return {
    title: "Card",
    description: "Log in to access your Ledger Card",
    loginLabel: "Login",
    isLoading: isInitiateAuthorizeLoading || isOpeningHostedLogin,
    errorMessage,
    onLoginPress,
  };
}
