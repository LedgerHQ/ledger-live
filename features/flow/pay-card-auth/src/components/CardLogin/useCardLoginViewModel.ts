import { useCallback, useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useMachine } from "@xstate/react";
import type { SnapshotFrom } from "xstate";
import { createCardLoginPorts, type CardLoginDispatch } from "../../state/createCardLoginPorts";
import type { PayCardLoginErrorKind } from "../../state/errors";
import { cardLoginMachine } from "../../state/machine";
import type { CardLoginViewModelParams, CardLoginViewProps } from "./types";

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

/**
 * Turns one machine snapshot into view props. It is a pure function so the mapping can be read, and
 * tested, without a React tree: `idle` and `error` offer the login action, `ready` shows nothing, and
 * every state in between is work in progress.
 */
export function mapSnapshotToViewProps(
  value: CardLoginStateValue,
  errorKind: PayCardLoginErrorKind | null,
): Omit<CardLoginViewProps, "onLoginPress"> {
  return {
    title: "Card",
    description: "Log in to access your Ledger Card",
    loginLabel: "Login",
    isHidden: value === "ready",
    isLoading: value !== "idle" && value !== "error" && value !== "ready",
    errorMessage: errorKind ? ERROR_MESSAGES[errorKind] : null,
  };
}

export function useCardLoginViewModel({
  openHostedLogin,
  oauthConfig,
  callback,
}: CardLoginViewModelParams): CardLoginViewProps {
  const dispatch = useDispatch<CardLoginDispatch>();

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
      send({ type: "CALLBACK_RECEIVED", code: callback.code, state: callback.state });
    }
  }, [callback, send]);

  const onLoginPress = useCallback(() => send({ type: "LOGIN" }), [send]);

  return {
    ...mapSnapshotToViewProps(snapshot.value, snapshot.context.errorKind),
    onLoginPress,
  };
}
