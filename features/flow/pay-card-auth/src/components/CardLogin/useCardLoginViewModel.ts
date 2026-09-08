import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMachine } from "@xstate/react";
import { useTranslation } from "@shared/i18n";
import type { SnapshotFrom } from "xstate";
import { createCardLoginPorts, type CardLoginDispatch } from "../../state/createCardLoginPorts";
import type { PayCardLoginErrorKind } from "../../state/errors";
import { cardLoginMachine } from "../../state/machine";
import { selectIsSignedIn } from "../../state/selectors";
import type { CardLoginViewModel, CardLoginViewModelParams } from "./types";

type CardLoginStateValue = SnapshotFrom<typeof cardLoginMachine>["value"];

export type CardLoginLabels = Readonly<{
  title: string;
  description: string;
  login: string;
  errors: Readonly<Record<PayCardLoginErrorKind, string>>;
}>;

/**
 * Turns one machine snapshot into the view props. It is a pure function so the mapping can be read,
 * and tested, without a React tree.
 */
export function mapSnapshotToViewModel(
  value: CardLoginStateValue,
  errorKind: PayCardLoginErrorKind | null,
  labels: CardLoginLabels,
  onLoginPress: () => void,
): CardLoginViewModel {
  // The card holder is signed in, so there is no login left to offer. `CardMore` holds the screen.
  if (value === "ready") {
    return null;
  }

  return {
    title: labels.title,
    description: labels.description,
    loginLabel: labels.login,
    // `awaitingCallback` waits for a redirect that may never arrive, so the login stays pressable.
    isLoading: value !== "idle" && value !== "error" && value !== "awaitingCallback",
    errorMessage: errorKind ? labels.errors[errorKind] : null,
    onLoginPress,
  };
}

export function useCardLoginViewModel({
  openHostedLogin,
  oauthConfig,
  callback,
}: CardLoginViewModelParams): CardLoginViewModel {
  const { t } = useTranslation();
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
    // `CardMore` ended the session. `ready` raises the flag on entry, so a lowered flag while the
    // machine still reads `ready` can only come from there, and this puts the login back on offer.
    if (!isSignedIn && snapshot.value === "ready") {
      send({ type: "SESSION_ENDED" });
    }
  }, [isSignedIn, snapshot.value, send]);

  const onLoginPress = useCallback(() => send({ type: "LOGIN" }), [send]);

  const labels = useMemo<CardLoginLabels>(
    () => ({
      title: t("payTab.cardLogin.title"),
      description: t("payTab.cardLogin.description"),
      login: t("payTab.cardLogin.login"),
      errors: {
        pkce_failed: t("payTab.cardLogin.errors.pkceFailed"),
        browser_open_failed: t("payTab.cardLogin.errors.browserOpenFailed"),
        missing_attempt: t("payTab.cardLogin.errors.missingAttempt"),
        exchange_failed: t("payTab.cardLogin.errors.exchangeFailed"),
        persist_failed: t("payTab.cardLogin.errors.persistFailed"),
        fetch_user_failed: t("payTab.cardLogin.errors.fetchUserFailed"),
      },
    }),
    [t],
  );

  return mapSnapshotToViewModel(snapshot.value, snapshot.context.errorKind, labels, onLoginPress);
}
