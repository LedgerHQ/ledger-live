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
  CardLoginCopy,
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

const LOGIN_KEY_PREFIX = "payTab.cardLogin";

const INTRO_KEY_PREFIX = "payTab.cardLoginIntro";

const INTRO_ROWS: readonly { icon: CardLoginIntroRowIcon; key: string }[] = [
  { icon: "CoinsAddPlus", key: "cashback" },
  { icon: "CreditCard", key: "virtualCard" },
  { icon: "LedgerLogo", key: "topUp" },
];

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
  copy: CardLoginCopy,
  onLoginPress: () => void,
  intro: CardLoginIntroViewProps,
): CardLoginViewModel {
  // The card holder is signed in, so there is no login left to offer. `CardMore` holds the screen.
  if (value === "ready") {
    return null;
  }

  return {
    ...copy,
    isLoading: value !== "idle" && value !== "error",
    errorMessage: errorKind ? ERROR_MESSAGES[errorKind] : null,
    onLoginPress,
    intro,
  };
}

export function useCardLoginViewModel({
  openHostedLogin,
  mobileWallet,
  oauthConfig,
  callback,
}: CardLoginViewModelParams): CardLoginViewModel {
  const dispatch = useDispatch<CardLoginDispatch>();
  const isSignedIn = useSelector(selectIsSignedIn);
  const { t } = useTranslation();
  const hasSeenLoginIntro = useSelector(selectPayCardHasSeenLoginIntro);
  const [isIntroRequested, setIsIntroRequested] = useState(false);
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
    if (snapshot.value === "ready" && hasStartedLogin) {
      dispatch(markPayCardLoginIntroSeen());
    }
  }, [snapshot.value, hasStartedLogin, dispatch]);

  const isIntroOpen = isIntroRequested && (snapshot.value === "idle" || snapshot.value === "error");

  const startLogin = useCallback(() => {
    setHasStartedLogin(true);
    send({ type: "LOGIN" });
  }, [send]);

  const onLoginPress = useCallback(() => {
    if (hasSeenLoginIntro) {
      startLogin();
      return;
    }
    setIsIntroRequested(true);
  }, [hasSeenLoginIntro, startLogin]);

  const onIntroActionPress = useCallback(() => {
    if (!isIntroOpen) {
      return;
    }
    setIsIntroRequested(false);
    startLogin();
  }, [isIntroOpen, startLogin]);

  const onIntroClose = useCallback(() => {
    if (!isIntroOpen) {
      return;
    }
    setIsIntroRequested(false);
  }, [isIntroOpen]);

  const introRows = useMemo(() => {
    const wallet = t(`${INTRO_KEY_PREFIX}.wallets.${mobileWallet}`);

    return INTRO_ROWS.map(({ icon, key }) => ({
      icon,
      title: t(`${INTRO_KEY_PREFIX}.rows.${key}.title`),
      description: t(`${INTRO_KEY_PREFIX}.rows.${key}.description`, { wallet }),
    }));
  }, [t, mobileWallet]);

  const introActions = useMemo(
    () =>
      INTRO_ACTIONS.map(({ id, appearance }) => ({
        id,
        appearance,
        label: t(`${INTRO_KEY_PREFIX}.${id}`),
      })),
    [t],
  );

  const copy = useMemo<CardLoginCopy>(() => {
    const stage = hasSeenLoginIntro ? "afterIntro" : "beforeIntro";

    return {
      title: t(`${LOGIN_KEY_PREFIX}.title`),
      description: t(`${LOGIN_KEY_PREFIX}.${stage}.description`),
      loginLabel: t(`${LOGIN_KEY_PREFIX}.${stage}.action`),
    };
  }, [t, hasSeenLoginIntro]);

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

  return mapSnapshotToViewModel(
    snapshot.value,
    snapshot.context.errorKind,
    copy,
    onLoginPress,
    intro,
  );
}
