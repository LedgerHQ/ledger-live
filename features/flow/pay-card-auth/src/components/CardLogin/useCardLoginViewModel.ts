import { useCallback, useState } from "react";
import { useInitiateAuthorizeMutation } from "@domain/api-card-management";
import { useDispatch } from "react-redux";
import { clearAuthorizeAttempt, startAuthorizeAttempt } from "../../state";
import { createAuthorizeAttempt } from "../../state/authorizeAttempt";
import type { CardLoginViewModelParams, CardLoginViewProps } from "./types";

export function useCardLoginViewModel({
  openHostedLogin,
}: CardLoginViewModelParams): CardLoginViewProps {
  const dispatch = useDispatch();
  const [initiateAuthorize, { isLoading: isInitiateAuthorizeLoading }] =
    useInitiateAuthorizeMutation();
  const [isOpeningHostedLogin, setIsOpeningHostedLogin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onLoginPress = useCallback(() => {
    setErrorMessage(null);

    void (async () => {
      setIsOpeningHostedLogin(true);
      try {
        const { state, codeVerifier, codeChallenge } = await createAuthorizeAttempt();
        // Recorded before the request leaves: the callback is only valid against an attempt already
        // on record, and the hosted UI can come back as soon as the browser opens.
        dispatch(startAuthorizeAttempt({ state, codeVerifier }));

        const { url, redirectUri } = await initiateAuthorize({
          state,
          codeChallenge,
        }).unwrap();

        const outcome = await openHostedLogin(url, redirectUri);

        // Closing the browser is not an error, but nothing can complete that attempt any more.
        if (outcome === "cancelled") {
          dispatch(clearAuthorizeAttempt());
        }
      } catch (error) {
        // Nothing can complete this attempt any more, so the verifier and `state` go with it.
        dispatch(clearAuthorizeAttempt());
        setErrorMessage(
          error instanceof Error && error.message ? error.message : "Unable to start login",
        );
      } finally {
        setIsOpeningHostedLogin(false);
      }
    })();
  }, [openHostedLogin, initiateAuthorize, dispatch]);

  return {
    title: "Card",
    description: "Log in to access your Ledger Card",
    loginLabel: "Login",
    isLoading: isInitiateAuthorizeLoading || isOpeningHostedLogin,
    errorMessage,
    onLoginPress,
  };
}
