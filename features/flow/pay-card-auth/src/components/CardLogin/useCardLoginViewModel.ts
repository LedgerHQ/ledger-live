import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMachine } from "@xstate/react";
import type { SnapshotFrom } from "xstate";
import { createCardLoginPorts, type CardLoginDispatch } from "../../state/createCardLoginPorts";
import type { PayCardLoginErrorKind } from "../../state/errors";
import { cardLoginMachine } from "../../state/machine";
import { selectIsSignedIn } from "../../state/slice";
import type { CardLoginViewModel, CardLoginViewModelParams } from "./types";

type CardLoginStateValue = SnapshotFrom<typeof cardLoginMachine>["value"];

/** Hardcoded English until the Pay tab gets its copy keys. */
const ERROR_MESSAGES: Record<PayCardLoginErrorKind, string> = {
  pkce_failed: "Login could not start. Please try again.",
  browser_open_failed: "The login page could not open. Please try again.",
  missing_attempt: "This login is no longer valid. Please log in again.",
  exchange_failed: "Login could not be completed. Please try again.",
  persist_failed: "Your session could not be saved. Please try again.",
  fetch_user_failed: "Your card could not be loaded. Please try again.",
};

/**
 * Turns one machine snapshot into the view props. It is a pure function so the mapping can be read,
 * and tested, without a React tree.
 */
export function mapSnapshotToViewModel(
  value: CardLoginStateValue,
  errorKind: PayCardLoginErrorKind | null,
  onLoginPress: () => void,
): CardLoginViewModel {
  // The card holder is signed in, so there is no login left to offer. `CardLogout` holds the screen.
  if (value === "ready") {
    return null;
  }

  return {
    title: "Card",
    description: "Log in to access your Ledger Card",
    loginLabel: "Login",
    isLoading: value !== "idle" && value !== "error",
    errorMessage: errorKind ? ERROR_MESSAGES[errorKind] : null,
    onLoginPress,
  };
}

export function useCardLoginViewModel({
  openHostedLogin,
  oauthConfig,
  callback,
}: CardLoginViewModelParams): CardLoginViewModel {
  const dispatch = useDispatch<CardLoginDispatch>();
  const isSignedIn = useSelector(selectIsSignedIn);

  const ports = useMemo(
    () => createCardLoginPorts({ dispatch, openHostedLogin }),
    [dispatch, openHostedLogin],
  );

  const [snapshot, send] = useMachine(cardLoginMachine, {
    input: { ports, oauthConfig, callback },
  });

  useEffect(() => {
    // A redirect that arrives while the screen is already open. The machine ignores it unless it is
    // waiting for one, so a repeat is harmless: the first callback wins.
    if (callback) {
      send({ type: "CALLBACK_RECEIVED", code: callback.code });
    }
  }, [callback, send]);

  useEffect(() => {
    // `CardLogout` ended the session. `ready` raises the flag on entry, so a lowered flag while the
    // machine still reads `ready` can only come from there, and this puts the login back on offer.
    if (!isSignedIn && snapshot.value === "ready") {
      send({ type: "SESSION_ENDED" });
    }
  }, [isSignedIn, snapshot.value, send]);

  const onLoginPress = useCallback(() => send({ type: "LOGIN" }), [send]);

  return mapSnapshotToViewModel(snapshot.value, snapshot.context.errorKind, onLoginPress);
}
