import { useCallback, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useGetUserQuery } from "@domain/api-card-management";
import type { PayCardUser } from "@domain/api-card-management";
import { useMachine } from "@xstate/react";
import type { SnapshotFrom } from "xstate";
import { createCardLoginPorts, type CardLoginDispatch } from "../../state/createCardLoginPorts";
import type { PayCardLoginErrorKind } from "../../state/errors";
import { cardLoginMachine } from "../../state/machine";
import type { CardLoginViewModel, CardLoginViewModelParams } from "./types";

type CardLoginStateValue = SnapshotFrom<typeof cardLoginMachine>["value"];

/** Hardcoded English until the Pay tab gets its copy keys. */
const ERROR_MESSAGES: Record<PayCardLoginErrorKind, string> = {
  pkce_failed: "Login could not start. Please try again.",
  initiate_failed: "Login could not start. Please try again.",
  browser_open_failed: "The login page could not open. Please try again.",
  missing_attempt: "This login is no longer valid. Please log in again.",
  state_mismatch: "This login could not be verified. Please log in again.",
  exchange_failed: "Login could not be completed. Please try again.",
  persist_failed: "Your session could not be saved. Please try again.",
  fetch_user_failed: "Your card could not be loaded. Please try again.",
};

const VERIFICATION_LABELS: Record<PayCardUser["verificationState"], string> = {
  UNVERIFIED: "Not verified",
  PENDING: "In review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

/** The states that mean the card holder is signed in, whatever the flow is doing about it. */
function isSignedIn(value: CardLoginStateValue): boolean {
  return value === "ready" || value === "loggingOut";
}

/**
 * Turns one machine snapshot, plus the user in the cache, into the view props. It is a pure function so
 * the mapping can be read, and tested, without a React tree.
 */
export function mapSnapshotToViewModel(
  value: CardLoginStateValue,
  errorKind: PayCardLoginErrorKind | null,
  user: PayCardUser | undefined,
  handlers: { onLoginPress: () => void; onLogoutPress: () => void },
): CardLoginViewModel {
  if (isSignedIn(value)) {
    // The card holder is signed in, but the user answer may still be on its way back from the cache.
    return user
      ? {
          login: null,
          user: {
            title: "Card",
            idLabel: "Account",
            userId: user.id,
            verificationLabel: "Verification",
            verificationValue: VERIFICATION_LABELS[user.verificationState],
            logoutLabel: "Log out",
            isLoading: value === "loggingOut",
            onLogoutPress: handlers.onLogoutPress,
          },
        }
      : { login: null, user: null };
  }

  return {
    login: {
      title: "Card",
      description: "Log in to access your Ledger Card",
      loginLabel: "Login",
      isLoading: value !== "idle" && value !== "error",
      errorMessage: errorKind ? ERROR_MESSAGES[errorKind] : null,
      onLoginPress: handlers.onLoginPress,
    },
    user: null,
  };
}

export function useCardLoginViewModel({
  openHostedLogin,
  oauthConfig,
  callback,
}: CardLoginViewModelParams): CardLoginViewModel {
  const dispatch = useDispatch<CardLoginDispatch>();

  const ports = useMemo(
    () => createCardLoginPorts({ dispatch, openHostedLogin }),
    [dispatch, openHostedLogin],
  );

  const [snapshot, send] = useMachine(cardLoginMachine, {
    input: { ports, oauthConfig, callback },
  });

  // The machine already filled this cache entry. Subscribing keeps the answer alive while the panel is
  // on screen, and asks for it again if the entry expired first.
  const { data: user } = useGetUserQuery(undefined, { skip: !isSignedIn(snapshot.value) });

  useEffect(() => {
    // A redirect that arrives while the screen is already open. The machine ignores it unless it is
    // waiting for one, so a repeat is harmless: the first callback wins.
    if (callback) {
      send({ type: "CALLBACK_RECEIVED", code: callback.code, state: callback.state });
    }
  }, [callback, send]);

  const onLoginPress = useCallback(() => send({ type: "LOGIN" }), [send]);
  const onLogoutPress = useCallback(() => send({ type: "LOGOUT" }), [send]);

  return mapSnapshotToViewModel(snapshot.value, snapshot.context.errorKind, user, {
    onLoginPress,
    onLogoutPress,
  });
}
