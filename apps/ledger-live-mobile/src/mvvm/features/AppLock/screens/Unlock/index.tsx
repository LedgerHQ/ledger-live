import {
  isPasswordLongEnough,
  selectBiometricsEnabled,
  selectHasPassword,
  setNeedsLongerPassword,
  unlockApp,
} from "@features/platform-app-lock";
import {
  isShowingSplash,
  UnlockView,
  useUnlockViewModel,
  type UnlockLabels,
} from "@features/flow-app-lock";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Logos } from "@ledgerhq/native-ui";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "styled-components/native";
import { useDispatch, useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { checkPassword } from "../../adapters/passwordVerification";
import { ForgotPasswordSheet } from "../../components/ForgotPasswordSheet";
import { useBiometricUnlock } from "../../hooks/useBiometricUnlock";
import { useIsAppActive } from "../../hooks/useIsAppActive";
import { useKeyboardInset } from "../../hooks/useKeyboardInset";

// The mark's own viewBox, 38 by 32: sizing it square would letterbox it inside the box we give it.
const MARK_ASPECT_RATIO = 38 / 32;
const DESIGN_MARK_WIDTH = 67;

type ForgotPasswordPhase = "closed" | "dismissingKeyboard" | "open" | "hiding";

export function UnlockScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const biometricsEnabled = useSelector(selectBiometricsEnabled);
  const hasPassword = useSelector(selectHasPassword);
  const { runBiometricUnlock } = useBiometricUnlock();
  const insets = useSafeAreaInsets();
  const isAppActive = useIsAppActive();
  const keyboardInset = useKeyboardInset();
  const [failure, setFailure] = useState<string | undefined>(undefined);

  const labels = useMemo<UnlockLabels>(
    () => ({
      fieldLabel: t("appLock.field.label"),
      revealPassword: t("appLock.field.reveal"),
      hidePassword: t("appLock.field.hide"),
      useBiometrics: t("appLock.unlock.retryBiometrics"),
      wrongPasswordError: t("appLock.unlock.wrongPassword"),
      forgotPassword: t("appLock.unlock.forgotPassword"),
      unlockLabel: t("appLock.unlock.cta"),
    }),
    [t],
  );

  const onVerify = useCallback(
    async (password: string) => {
      setFailure(undefined);

      try {
        const check = await checkPassword(password);

        if (check.status === "incorrect") {
          return "incorrect" as const;
        }

        dispatch(setNeedsLongerPassword(!isPasswordLongEnough(password)));
        dispatch(unlockApp());
        return "unlocked" as const;
      } catch {
        setFailure(t("appLock.unlock.failed"));
        return "failed" as const;
      }
    },
    [dispatch, t],
  );

  const viewModel = useUnlockViewModel({
    onVerify,
    canRetryBiometrics: biometricsEnabled,
    onRetryBiometrics: runBiometricUnlock,
  });

  const [isAwaitingBiometrics, setIsAwaitingBiometrics] = useState(biometricsEnabled);
  const isPromptingRef = useRef(false);

  useEffect(() => {
    if (!isAwaitingBiometrics || !isAppActive || isPromptingRef.current) {
      return;
    }

    isPromptingRef.current = true;

    void runBiometricUnlock().then(unlocked => {
      isPromptingRef.current = false;

      if (!unlocked) {
        setIsAwaitingBiometrics(false);
      }
    });
  }, [isAppActive, isAwaitingBiometrics, runBiometricUnlock]);

  // The launch artwork is a square fitted to the screen in which the mark spans 441 of 1920 units,
  // so this screen draws it at the same size while it stands in for the splash.
  const { width, height } = useWindowDimensions();
  const splashMarkWidth = Math.round(Math.min(width, height) * (441 / 1920));
  const markWidth = isShowingSplash({ hasPassword, isAwaitingBiometrics })
    ? splashMarkWidth
    : DESIGN_MARK_WIDTH;

  const [forgotPassword, setForgotPassword] = useState<ForgotPasswordPhase>("closed");
  const openForgotPassword = useCallback(() => {
    if (!Keyboard.isVisible()) {
      setForgotPassword("open");
      return;
    }

    // A sheet measured against a keyboard mid-dismissal ends up drawn in one place and touchable in
    // another, which leaves it impossible to close.
    setForgotPassword("dismissingKeyboard");
    Keyboard.dismiss();
  }, []);

  useEffect(() => {
    if (forgotPassword !== "dismissingKeyboard") {
      return;
    }

    const hidden = Keyboard.addListener("keyboardDidHide", () => setForgotPassword("open"));

    return () => hidden.remove();
  }, [forgotPassword]);
  const closeForgotPassword = useCallback(() => setForgotPassword("hiding"), []);
  const onForgotPasswordHidden = useCallback(() => setForgotPassword("closed"), []);

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      <UnlockView
        isCovered={forgotPassword !== "closed"}
        hasPassword={hasPassword}
        isAwaitingBiometrics={isAwaitingBiometrics}
        isAppActive={isAppActive}
        {...viewModel}
        labels={labels}
        errorText={failure}
        logo={
          <Logos.LedgerLiveAltRegular
            color={colors.neutral.c100}
            width={markWidth}
            height={Math.round(markWidth / MARK_ASPECT_RATIO)}
          />
        }
        onForgotPassword={openForgotPassword}
        topInset={insets.top}
        bottomInset={insets.bottom}
        keyboardHeight={keyboardInset}
      />
      <ForgotPasswordSheet
        isOpen={forgotPassword === "open"}
        onClose={closeForgotPassword}
        onHidden={onForgotPasswordHidden}
      />
    </Box>
  );
}
