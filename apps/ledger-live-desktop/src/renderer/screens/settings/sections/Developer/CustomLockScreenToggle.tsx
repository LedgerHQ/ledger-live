import React, { useCallback } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import { useNavigate } from "react-router";

const CustomLockScreenToggle = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onNavigateToDebugScreen = useCallback(() => {
    navigate("/settings/developer/custom-locksscreen-assets");
  }, [navigate]);

  return (
    <>
      <Row
        title={t("settings.developer.customLockScreen")}
        desc={t("settings.developer.customLockScreenDesc")}
      >
        <Button size="sm" appearance="accent" onClick={onNavigateToDebugScreen}>
          {t("settings.developer.customLockScreenCTA")}
        </Button>
      </Row>
    </>
  );
};

export default CustomLockScreenToggle;
