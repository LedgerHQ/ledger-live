import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { Button } from "@ledgerhq/lumen-ui-react";
import { WalletFeaturesDevToolContent } from "./WalletFeaturesDevToolContent";

const WalletFeaturesDevTool = () => {
  const { t } = useTranslation();
  const [contentExpanded, setContentExpanded] = useState(false);

  const toggleContentVisibility = useCallback(() => {
    setContentExpanded(prev => !prev);
  }, []);

  return (
    <Row
      title={t("settings.developer.walletFeaturesDevTool.title")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: "flex-start" }}
      desc={<WalletFeaturesDevToolContent expanded={contentExpanded} />}
    >
      <Button appearance="accent" size="sm" onClick={toggleContentVisibility}>
        {contentExpanded ? t("settings.developer.hide") : t("settings.developer.show")}
      </Button>
    </Row>
  );
};

export default WalletFeaturesDevTool;
