import React, { useState } from "react";
import { BottomSheetHeader, BottomSheetView, Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { PasswordField } from "@features/flow-app-lock";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { useTranslation } from "~/context/Locale";
import type { CardNumbersUnlockDialogState } from "../../hooks/useUnlockForCardNumbers";

export function CardNumbersUnlockDialog(props: CardNumbersUnlockDialogState) {
  if (props.phase === "closed") {
    return null;
  }

  return <CardNumbersUnlockForm {...props} />;
}

function CardNumbersUnlockForm({
  phase,
  mode,
  error,
  onSubmit,
  onCancel,
}: CardNumbersUnlockDialogState) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const isCreate = mode === "create";
  const busy = phase === "submitting";

  const submit = () => {
    void onSubmit(password, confirmPassword);
  };

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened
      onClose={busy ? () => undefined : onCancel}
      preventBackdropClick={busy}
      enablePanDownToClose={!busy}
      enableDynamicSizing
      testID="card-numbers-unlock-sheet"
    >
      <BottomSheetView>
        <BottomSheetHeader density="compact" />
        <Box lx={{ gap: "s16", paddingHorizontal: "s16", paddingBottom: "s24" }}>
          <Text typography="heading4SemiBold" testID="card-numbers-unlock-title">
            {isCreate ? t("appLock.setupPassword.title") : t("payTab.card.numbers.unlockTitle")}
          </Text>
          {isCreate ? (
            <Text typography="body2">{t("appLock.setupPassword.description")}</Text>
          ) : null}
          <PasswordField
            value={password}
            onChangeText={setPassword}
            helperText={error}
            hasError={Boolean(error)}
            autoFocus
            onSubmitEditing={isCreate ? undefined : submit}
            testID="card-numbers-password"
          />
          {isCreate ? (
            <PasswordField
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              hasError={Boolean(error)}
              onSubmitEditing={submit}
              testID="card-numbers-confirm-password"
            />
          ) : null}
          <Box lx={{ flexDirection: "row", gap: "s8" }}>
            <Box lx={{ flex: 1 }}>
              <Button appearance="gray" isFull disabled={busy} onPress={onCancel}>
                {t("common.cancel")}
              </Button>
            </Box>
            <Box lx={{ flex: 1 }}>
              <Button appearance="base" isFull disabled={busy} loading={busy} onPress={submit}>
                {t("common.confirm")}
              </Button>
            </Box>
          </Box>
        </Box>
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
