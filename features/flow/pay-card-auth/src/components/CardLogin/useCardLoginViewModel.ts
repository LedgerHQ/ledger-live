import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMachine } from "@xstate/react";
import type { SnapshotFrom } from "xstate";
import { useTranslation } from "@shared/i18n";
import { createCardLoginPorts, type CardLoginDispatch } from "../../state/createCardLoginPorts";
import type { PayCardLoginErrorKind } from "../../state/errors";
import { cardLoginMachine } from "../../state/machine";
import { selectPayCardHasSeenLoginIntro } from "../../state/loginIntroSelectors";
import { markPayCardLoginIntroSeen } from "../../state/loginIntroSlice";
import { selectIsSignedIn } from "../../state/selectors";
import type {
  CardLoginIntroActionId,
  CardLoginIntroRowIcon,
  CardLoginIntroViewProps,
  CardLoginViewModel,
  CardLoginViewModelParams,
} from "./types";

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

const INTRO_KEY_PREFIX = "payTab.cardLoginIntro";

/** Icon per row, paired with the translation sub-key that carries its copy. */
const INTRO_ROWS: readonly { icon: CardLoginIntroRowIcon; key: string }[] = [
  { icon: "CoinsAddPlus", key: "cashback" },
  { icon: "CreditCard", key: "virtualCard" },
  { icon: "Nano", key: "topUp" },
];

/** Both buttons run the same action. Drop an entry to cut the sheet down to one button. */
const INTRO_ACTIONS: readonly { id: CardLoginIntroActionId; appearance: "base" | "gray" }[] = [
  { id: "createAccount", appearance: "base" },
  { id: "logIn", appearance: "gray" },
];

/**
 * Turns one machine snapshot into the view props. It is a pure function so the mapping can be read,
 * and tested, without a React tree.
 */
export function mapSnapshotToViewModel(
  value: CardLoginStateValue,
  errorKind: PayCardLoginErrorKind | null,
  onLoginPress: () => void,
  intro: CardLoginIntroViewProps,
): CardLoginViewModel {
  // The card holder is signed in, so there is no login left to offer. `CardMore` holds the screen.
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
    intro,
  };
}

export function useCardLoginViewModel({
  openHostedLogin,
  oauthConfig,
  callback,
}: CardLoginViewModelParams): CardLoginViewModel {
  const dispatch = useDispatch<CardLoginDispatch>();
  const isSignedIn = useSelector(selectIsSignedIn);
  const { t } = useTranslation();
  const hasSeenLoginIntro = useSelector(selectPayCardHasSeenLoginIntro);
  const [isIntroRequested, setIsIntroRequested] = useState(false);
  /**
   * True once this mount has started a login. It is the only thing that tells a login apart from a
   * stored session the machine merely hydrated. It is state and not a ref, because both handlers
   * that would write a ref are handed back to the view, and `react(refs)` counts that as a
   * render-time ref access.
   */
  const [hasStartedLogin, setHasStartedLogin] = useState(false);

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

  useEffect(() => {
    // `ready` asserts a live session, but it does not say where that session came from: the machine
    // also reaches it by hydrating a stored one, and it sits there while a tester lowers the flag
    // from the Pay Card devtool. So the flag goes up only for a login this mount started. The flag
    // itself is deliberately not a dependency here — that is what lets a reset stay down.
    if (snapshot.value === "ready" && hasStartedLogin) {
      dispatch(markPayCardLoginIntroSeen());
    }
  }, [snapshot.value, hasStartedLogin, dispatch]);

  // The sheet belongs to `idle` and `error` only. The machine half of the test is defensive: every
  // path that starts a login lowers the request first, so no live path holds a requested intro over
  // a working machine. Derived, not stored, so the sheet cannot outlive its state by a render.
  const isIntroOpen = isIntroRequested && (snapshot.value === "idle" || snapshot.value === "error");

  const startLogin = useCallback(() => {
    // The one door to a login, so the one place that records that this mount started one.
    setHasStartedLogin(true);
    send({ type: "LOGIN" });
  }, [send]);

  const onLoginPress = useCallback(() => {
    // The intro is an intermediate step, not a rival screen: it only defers the same LOGIN event.
    if (hasSeenLoginIntro) {
      startLogin();
      return;
    }
    setIsIntroRequested(true);
  }, [hasSeenLoginIntro, startLogin]);

  const onIntroActionPress = useCallback(() => {
    // Every button runs the same login. The double press is dropped here, and not in either view,
    // because "how many logins may a press start" is this model's rule to hold.
    if (!isIntroOpen) {
      return;
    }
    setIsIntroRequested(false);
    startLogin();
  }, [isIntroOpen, startLogin]);

  const onIntroClose = useCallback(() => {
    // Closing is not completing. The flag stays down, so the next press shows the sheet again.
    if (!isIntroOpen) {
      return;
    }
    setIsIntroRequested(false);
  }, [isIntroOpen]);

  const introRows = useMemo(
    () =>
      INTRO_ROWS.map(({ icon, key }) => ({
        icon,
        title: t(`${INTRO_KEY_PREFIX}.rows.${key}.title`),
        description: t(`${INTRO_KEY_PREFIX}.rows.${key}.description`),
      })),
    [t],
  );

  const introActions = useMemo(
    () =>
      INTRO_ACTIONS.map(({ id, appearance }) => ({
        id,
        appearance,
        label: t(`${INTRO_KEY_PREFIX}.${id}`),
      })),
    [t],
  );

  const intro = useMemo<CardLoginIntroViewProps>(
    () => ({
      isOpen: isIntroOpen,
      title: t(`${INTRO_KEY_PREFIX}.title`),
      providedBy: t(`${INTRO_KEY_PREFIX}.providedBy`),
      rows: introRows,
      actions: introActions,
      onActionPress: onIntroActionPress,
      onClose: onIntroClose,
    }),
    [isIntroOpen, t, introRows, introActions, onIntroActionPress, onIntroClose],
  );

  return mapSnapshotToViewModel(snapshot.value, snapshot.context.errorKind, onLoginPress, intro);
}
