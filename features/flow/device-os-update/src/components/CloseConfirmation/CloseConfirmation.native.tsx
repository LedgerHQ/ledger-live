import React, { useCallback } from "react";
import type { CloseConfirmationProps } from "@features/platform-device-os-update";
import { useOsUpdateTracking } from "../../hooks/OsUpdateTrackingProvider";
import { OsUpdateButton } from "../../analytics/analyticsTypes";
import { CloseConfirmationContent } from "../sheets/CloseConfirmationContent/CloseConfirmationContent";
import { OsUpdateStateSheet } from "../sheets/OsUpdateStateSheet/OsUpdateStateSheet";

export function CloseConfirmation({ isOpen, onContinue, onCancel }: CloseConfirmationProps) {
  const { trackClick } = useOsUpdateTracking();
  const onPressContinue = useCallback(() => {
    trackClick(OsUpdateButton.CONTINUE);
    onContinue();
  }, [trackClick, onContinue]);
  const onPressCancel = useCallback(() => {
    trackClick(OsUpdateButton.CANCEL_OS_UPDATE);
    onCancel();
  }, [trackClick, onCancel]);

  return (
    <OsUpdateStateSheet isOpen={isOpen} onClose={onContinue} hideHeader>
      <CloseConfirmationContent onContinue={onPressContinue} onCancel={onPressCancel} />
    </OsUpdateStateSheet>
  );
}
