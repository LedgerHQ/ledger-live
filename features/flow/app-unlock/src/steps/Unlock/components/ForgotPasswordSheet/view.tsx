import {
  BottomSheet,
  BottomSheetHeader,
  BottomSheetView,
  useBottomSheetRef,
} from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { InfoState } from "@shared/ui-info-state/native";
import React, { useCallback, useEffect, useRef } from "react";
import type { ForgotPasswordSheetProps } from "./types";

// Not the queued sheet: the queue withholds sheets while the app is locked, which is the only
// time this one is asked for.
export function ForgotPasswordSheet({
  isOpen,
  onClose,
  bottomInset = 0,
  backgroundComponent,
}: ForgotPasswordSheetProps): React.JSX.Element {
  const { t } = useTranslation();
  const bottomSheetRef = useBottomSheetRef();
  const isClosingRef = useRef(true);

  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false;
      bottomSheetRef.current?.present();
    } else {
      isClosingRef.current = true;
      bottomSheetRef.current?.dismiss();
    }
  }, [bottomSheetRef, isOpen]);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    onClose();
    bottomSheetRef.current?.dismiss();
  }, [bottomSheetRef, onClose]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={null}
      enableDynamicSizing
      maxDynamicContentSize="fullWithOffset"
      backdropPressBehavior="close"
      backgroundComponent={backgroundComponent}
      onClose={handleClose}
      enablePanDownToClose
      testID="app-lock-forgot-password-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader density="compact" />
        <InfoState
          size="hug"
          preset="info"
          title={t("appLock.unlock.forgotPasswordSheet.title")}
          description={t("appLock.unlock.forgotPasswordSheet.description")}
          primaryCta={{
            label: t("appLock.unlock.forgotPasswordSheet.cta"),
            onPress: handleClose,
            testID: "app-lock-forgot-password-dismiss",
          }}
        />
      </BottomSheetView>
    </BottomSheet>
  );
}
