import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { InfoState } from "LLM/components/InfoState";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  isOpen: boolean;
  onDismiss: () => void;
}>;

export function PasswordChangedSheet({ isOpen, onDismiss }: Props): React.JSX.Element {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <QueuedBottomSheet
      isForcingToBeOpened={isOpen}
      onHeaderClosePressed={onDismiss}
      onBackdropPress={onDismiss}
      enableDynamicSizing
      testID="app-lock-password-changed-sheet"
    >
      <BottomSheetView style={{ paddingBottom: insets.bottom }}>
        <BottomSheetHeader />
        <InfoState
          size="hug"
          preset="success"
          title={t("appLock.longerPassword.changed.title")}
          primaryCta={{
            label: t("appLock.longerPassword.changed.cta"),
            onPress: onDismiss,
            testID: "app-lock-password-changed-dismiss",
          }}
        />
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
