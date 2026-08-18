import { BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { Lock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import React from "react";
import type { EnableProtectionSheetProps } from "./types";

export function EnableProtectionSheet({
  isOpen,
  variant,
  onConfirm,
  onClose,
  labels,
}: EnableProtectionSheetProps): React.JSX.Element {
  const isBiometrics = variant === "biometrics";

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID="app-lock-enable-protection-sheet"
    >
      <BottomSheetView>
        <Box
          lx={{ alignItems: "center", paddingHorizontal: "s16", paddingBottom: "s24", gap: "s16" }}
        >
          <Lock size={32} />
          <Text lx={{ textAlign: "center" }}>
            {isBiometrics ? labels.biometricsTitle : labels.passwordTitle}
          </Text>
          <Text lx={{ textAlign: "center", color: "muted" }}>
            {isBiometrics ? labels.biometricsDescription : labels.passwordDescription}
          </Text>
          <Button
            appearance="base"
            onPress={onConfirm}
            testID="app-lock-enable-protection-confirm"
            lx={{ alignSelf: "stretch" }}
          >
            {isBiometrics ? labels.biometricsCta : labels.passwordCta}
          </Button>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
