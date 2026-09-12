import React, { useEffect, useState } from "react";
import { PasswordField } from "@features/flow-app-lock";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "@shared/i18n";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { CardNumbersUnlockSheetState } from "../../hooks/useUnlockForCardNumbers";

export function CardNumbersUnlockSheet({
  isOpen,
  error,
  isBusy,
  onSubmit,
  onClose,
}: CardNumbersUnlockSheetState) {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setPassword("");
    }
  }, [isOpen]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      enableDynamicSizing
      onClose={isBusy ? undefined : onClose}
      testID="card-numbers-unlock-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottom + 16 }}>
        <BottomSheetHeader />
        <Box lx={{ paddingHorizontal: "s16", gap: "s16" }}>
          <Text typography="large">{t("payTab.card.numbers.unlockTitle")}</Text>
          <PasswordField
            value={password}
            onChangeText={setPassword}
            labels={{
              fieldLabel: t("appLock.field.label"),
              revealPassword: t("appLock.field.reveal"),
              hidePassword: t("appLock.field.hide"),
            }}
            helperText={error}
            hasError={Boolean(error)}
            autoFocus
            onSubmitEditing={() => void onSubmit(password)}
            testID="card-numbers-unlock-password"
          />
          <Button
            appearance="base"
            disabled={isBusy}
            onPress={() => void onSubmit(password)}
            testID="card-numbers-unlock-confirm"
          >
            {t("common.confirm")}
          </Button>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
