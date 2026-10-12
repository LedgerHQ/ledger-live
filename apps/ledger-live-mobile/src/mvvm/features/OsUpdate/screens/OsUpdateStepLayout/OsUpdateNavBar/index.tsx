import React from "react";
import { IconButton, NavBar, NavBarTrailing } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";

type OsUpdateNavBarProps = Readonly<{
  onClose: () => void;
}>;

export function OsUpdateNavBar({ onClose }: OsUpdateNavBarProps) {
  const { t } = useTranslation();

  return (
    <NavBar density="compact" testID="os-update-nav-bar">
      <NavBarTrailing>
        <IconButton
          appearance="no-background"
          size="md"
          icon={Close}
          accessibilityLabel={t("osUpdates.actions.close")}
          onPress={onClose}
          testID="os-update-close-button"
        />
      </NavBarTrailing>
    </NavBar>
  );
}
