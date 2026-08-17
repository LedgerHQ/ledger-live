import { selectBiometricsEnabled, unlockApp } from "@features/platform-app-lock";
import { UnlockView, useUnlockViewModel, type UnlockLabels } from "@features/flow-app-lock";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { Logos } from "@ledgerhq/native-ui";
import React, { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "styled-components/native";
import StyleProvider from "~/StyleProvider";
import { useDispatch, useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { checkPassword } from "../../adapters/passwordVerification";
import { useBiometricUnlock } from "../../hooks/useBiometricUnlock";
import { useKeyboardInset } from "../../hooks/useKeyboardInset";

export function UnlockScreen(): React.JSX.Element {
  return (
    <StyleProvider selectedPalette="dark">
      <UnlockScreenContent />
    </StyleProvider>
  );
}

function UnlockScreenContent(): React.JSX.Element {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const biometricsEnabled = useSelector(selectBiometricsEnabled);
  const { runBiometricUnlock } = useBiometricUnlock();
  const insets = useSafeAreaInsets();
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

  return (
    <Box lx={{ flex: 1, backgroundColor: "canvas" }}>
      <UnlockView
        {...viewModel}
        labels={labels}
        errorText={failure}
        logo={<Logos.LedgerLiveAltRegular color={colors.neutral.c100} width={67} height={56} />}
        topInset={insets.top}
        bottomInset={insets.bottom}
        keyboardHeight={keyboardInset}
      />
    </Box>
  );
}
