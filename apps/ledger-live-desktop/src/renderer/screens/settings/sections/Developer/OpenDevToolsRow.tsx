import React, { useCallback } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";

export default function OpenDevToolsRow() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onOpen = useCallback(() => {
    navigate("/devtools");
  }, [navigate]);

  return (
    <SettingsSectionRow
      title={t("settings.developer.devTools.rowTitle")}
      desc={t("settings.developer.devTools.rowDesc")}
    >
      <Button size="sm" appearance="accent" onClick={onOpen}>
        {t("settings.developer.open")}
      </Button>
    </SettingsSectionRow>
  );
}
