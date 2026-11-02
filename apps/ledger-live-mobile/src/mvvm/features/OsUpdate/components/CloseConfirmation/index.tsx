import React, { useCallback } from "react";
import type { CloseConfirmationComponent } from "@ledgerhq/live-common/os-update/types";
import { useOsUpdateTracking } from "../../analytics/TrackingProvider";
import { OsUpdateButton } from "../../analytics/types";
import { CloseConfirmationContent } from "../../sheets/CloseConfirmationContent";
import { OsUpdateStateSheet } from "../../sheets/OsUpdateStateSheet";

export const CloseConfirmation: CloseConfirmationComponent = ({ isOpen, onContinue, onCancel }) => {
  const { trackClick } = useOsUpdateTracking();
  const onPressContinue = useCallback(() => {
    trackClick(OsUpdateButton.CONTINUE);
    onContinue();
  }, [trackClick, onContinue]);
  const onPressCancel = useCallback(() => {
    trackClick(OsUpdateButton.CANCEL);
    onCancel();
  }, [trackClick, onCancel]);

  return (
    <OsUpdateStateSheet isOpen={isOpen} onClose={onContinue} hideHeader>
      <CloseConfirmationContent onContinue={onPressContinue} onCancel={onPressCancel} />
    </OsUpdateStateSheet>
  );
};
