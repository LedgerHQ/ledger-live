import React, { useCallback } from "react";
import { IconButton, NavBar, NavBarTrailing } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { useOsUpdateTracking } from "../../../analytics/TrackingProvider";
import { OsUpdateButton } from "../../../analytics/types";

type OsUpdateNavBarProps = Readonly<{
  onClose: () => void;
}>;

export function OsUpdateNavBar({ onClose }: OsUpdateNavBarProps) {
  const { t } = useTranslation();
  const { trackClick } = useOsUpdateTracking();
  const onPressClose = useCallback(() => {
    trackClick(OsUpdateButton.CLOSE);
    onClose();
  }, [trackClick, onClose]);

  return (
    <NavBar density="compact" testID="os-update-nav-bar">
      <NavBarTrailing>
        <IconButton
          appearance="no-background"
          size="md"
          icon={Close}
          accessibilityLabel={t("osUpdates.actions.close")}
          onPress={onPressClose}
          testID="os-update-close-button"
        />
      </NavBarTrailing>
    </NavBar>
  );
}
