import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { InfoState } from "LLM/components/InfoState";
import React from "react";
import { useTranslation } from "~/context/Locale";

type Props = Readonly<{
  isOpen: boolean;
  onClose: () => void;
  onHidden: () => void;
}>;

export function ForgotPasswordSheet({ isOpen, onClose, onHidden }: Props): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onHeaderClosePressed={onClose}
      onBackdropPress={onClose}
      onModalHide={onHidden}
      enableDynamicSizing
      testID="app-lock-forgot-password-sheet"
    >
      <BottomSheetView>
        <BottomSheetHeader />
        <InfoState
          size="hug"
          preset="info"
          title={t("appLock.unlock.forgotPasswordSheet.title")}
          description={t("appLock.unlock.forgotPasswordSheet.description")}
          primaryCta={{
            label: t("appLock.unlock.forgotPasswordSheet.cta"),
            onPress: onClose,
            testID: "app-lock-forgot-password-dismiss",
          }}
        />
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
