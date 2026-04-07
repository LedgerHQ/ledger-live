import React, { useCallback } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { SettingsSectionRow as Row } from "../../../SettingsSection";

export default function AnalyticsConsentOptInDevTool() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onOpen = useCallback(() => {
    navigate("/settings/developer/analytics-consent-opt-in-qa");
  }, [navigate]);

  return (
    <Row
      title={t("settings.developer.analyticsConsentOptInQa.rowTitle")}
      desc={t("settings.developer.analyticsConsentOptInQa.rowDesc")}
    >
      <Button size="sm" appearance="accent" onClick={onOpen}>
        {t("settings.developer.open")}
      </Button>
    </Row>
  );
}
