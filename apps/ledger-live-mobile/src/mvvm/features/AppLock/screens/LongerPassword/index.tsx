import {
  ConfirmPasswordView,
  PasswordDraftProvider,
  SetupPasswordView,
  useConfirmPasswordViewModel,
  usePasswordDraft,
  useSetupPasswordViewModel,
  type ConfirmPasswordLabels,
  type SetupPasswordLabels,
} from "@features/flow-app-lock";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { OverAppLock } from "LLM/components/QueuedDrawer/useIsScreenVisible";
import React, { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import { ChangePasswordSheet } from "../../components/ChangePasswordSheet";
import { PasswordChangedSheet } from "../../components/PasswordChangedSheet";
import { useKeyboardInset } from "../../hooks/useKeyboardInset";
import { usePasswordSetup } from "../../hooks/usePasswordSetup";

type Phase = "prompt" | "dismissingPrompt" | "choose" | "confirm" | "changed";

export function LongerPasswordScreen({
  onDone,
}: Readonly<{ onDone: () => void }>): React.JSX.Element {
  return (
    <OverAppLock>
      <PasswordDraftProvider>
        <LongerPasswordPhases onDone={onDone} />
      </PasswordDraftProvider>
    </OverAppLock>
  );
}

function LongerPasswordPhases({ onDone }: Readonly<{ onDone: () => void }>): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>("prompt");

  const onPromptHidden = useCallback(
    () => setPhase(current => (current === "dismissingPrompt" ? "choose" : current)),
    [],
  );

  return (
    <>
      <ChangePasswordSheet
        isOpen={phase === "prompt"}
        onConfirm={() => setPhase("dismissingPrompt")}
        onHidden={onPromptHidden}
      />

      {phase === "choose" || phase === "confirm" ? (
        <Screen>
          {phase === "choose" ? (
            <ChooseStep onValid={() => setPhase("confirm")} />
          ) : (
            <ConfirmStep onSaved={() => setPhase("changed")} />
          )}
        </Screen>
      ) : null}

      <PasswordChangedSheet isOpen={phase === "changed"} onDismiss={onDone} />
    </>
  );
}

function Screen({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <Box
      lx={{ flex: 1, backgroundColor: "canvas" }}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      testID="app-lock-longer-password-screen"
    >
      {children}
    </Box>
  );
}

function Header({ title }: Readonly<{ title: string }>): React.JSX.Element {
  return (
    <Box lx={{ paddingHorizontal: "s16", paddingVertical: "s24" }}>
      <Text typography="heading4SemiBold" lx={{ color: "base" }}>
        {title}
      </Text>
    </Box>
  );
}

function ChooseStep({ onValid }: Readonly<{ onValid: () => void }>): React.JSX.Element {
  const { t } = useTranslation();

  const labels = useMemo<SetupPasswordLabels>(
    () => ({
      fieldLabel: t("appLock.field.label"),
      revealPassword: t("appLock.field.reveal"),
      hidePassword: t("appLock.field.hide"),
      minLengthHelper: t("appLock.field.minLength"),
      continueLabel: t("appLock.setupPassword.cta"),
    }),
    [t],
  );

  const keyboardInset = useKeyboardInset();
  const viewModel = useSetupPasswordViewModel({ onValid });

  return (
    <>
      <Header title={t("appLock.longerPassword.choose.title")} />
      <SetupPasswordView {...viewModel} labels={labels} keyboardHeight={keyboardInset} />
    </>
  );
}

function ConfirmStep({ onSaved }: Readonly<{ onSaved: () => void }>): React.JSX.Element {
  const { t } = useTranslation();
  const draft = usePasswordDraft();
  const { savePassword } = usePasswordSetup();
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  const labels = useMemo<ConfirmPasswordLabels>(
    () => ({
      fieldLabel: t("appLock.field.label"),
      revealPassword: t("appLock.field.reveal"),
      hidePassword: t("appLock.field.hide"),
      minLengthHelper: t("appLock.field.minLength"),
      mismatchError: t("appLock.confirmPassword.mismatch"),
      confirmLabel: t("appLock.confirmPassword.cta"),
    }),
    [t],
  );

  const onConfirmed = useCallback(
    async (password: string) => {
      setSaveError(undefined);

      try {
        await savePassword(password);
      } catch {
        setSaveError(t("appLock.confirmPassword.saveFailed"));
        return;
      }

      draft.clear();
      onSaved();
    },
    [draft, onSaved, savePassword, t],
  );

  const keyboardInset = useKeyboardInset();
  const viewModel = useConfirmPasswordViewModel({ onConfirmed });

  return (
    <>
      <Header title={t("appLock.longerPassword.confirm.title")} />
      <ConfirmPasswordView
        {...viewModel}
        labels={labels}
        errorText={saveError}
        keyboardHeight={keyboardInset}
      />
    </>
  );
}
