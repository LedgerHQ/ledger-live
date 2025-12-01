import React, { useCallback } from "react";
import { Button } from "@ledgerhq/ldls-ui-react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow as Row } from "../../SettingsSection";
import { useHistory } from "react-router-dom";

const CustomLockScreenToggle = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const onNavigateToDebugScreen = useCallback(() => {
    history.push({
      pathname: "/settings/developer/custom-locksscreen-assets",
    });
  }, [history]);

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
