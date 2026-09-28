import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import React from "react";
import { ChangePasswordSheet } from "../components/ChangePasswordSheet";
import { PasswordChangedSheet } from "../components/PasswordChangedSheet";
import { ConfirmStep } from "./internals/ConfirmStep";
import { EnterStep } from "./internals/EnterStep";
import type { LongerPasswordViewProps } from "./types";

export function LongerPasswordView({
  step,
  hasSaveFailed,
  onChangeRequested,
  onPromptHidden,
  onEntered,
  onConfirmed,
  onDone,
  topInset = 0,
  bottomInset = 0,
  keyboardHeight = 0,
}: LongerPasswordViewProps): React.JSX.Element {
  const { t } = useTranslation();

  if (step === "prompt" || step === "closing") {
    return (
      <ChangePasswordSheet
        isOpen={step === "prompt"}
        bottomInset={bottomInset}
        onChange={onChangeRequested}
        onHidden={onPromptHidden}
      />
    );
  }

  if (step === "done") {
    return <PasswordChangedSheet isOpen bottomInset={bottomInset} onDone={onDone} />;
  }

  const isEntering = step === "enter";

  return (
    <Box
      lx={{ flex: 1, backgroundColor: "canvas", gap: "s24" }}
      style={{ paddingTop: topInset }}
      testID="app-lock-longer-password-overlay"
    >
      <Box lx={{ paddingHorizontal: "s16", paddingTop: "s24" }}>
        <Text typography="heading2SemiBold" lx={{ color: "base" }}>
          {isEntering
            ? t("appLock.longerPassword.enter.title")
            : t("appLock.longerPassword.confirm.title")}
        </Text>
      </Box>

      {isEntering ? (
        <EnterStep onValid={onEntered} keyboardHeight={keyboardHeight} bottomInset={bottomInset} />
      ) : (
        <ConfirmStep
          onConfirmed={onConfirmed}
          hasSaveFailed={hasSaveFailed}
          keyboardHeight={keyboardHeight}
          bottomInset={bottomInset}
        />
      )}
    </Box>
  );
}
