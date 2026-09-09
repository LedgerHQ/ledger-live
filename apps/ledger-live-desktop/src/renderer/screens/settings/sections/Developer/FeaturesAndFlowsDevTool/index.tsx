import React, { useState } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "react-i18next";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import { RecoverSubscriptionStateSection } from "./RecoverSubscriptionStateSection";

const FeaturesAndFlowsDevTool = () => {
  const { t } = useTranslation();
  const [contentExpanded, setContentExpanded] = useState(false);

  const toggleContentVisibility = () => {
    setContentExpanded(prev => !prev);
  };

  return (
    <Row
      title={t("settings.developer.featuresAndFlowsDevTool.title")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: "flex-start" }}
      desc={
        <div className="flex flex-col gap-2 pt-2">
          <p className="text-muted">
            {t("settings.developer.featuresAndFlowsDevTool.description")}
          </p>

          {contentExpanded ? (
            <div className="mt-4 flex flex-col gap-12">
              <RecoverSubscriptionStateSection />
            </div>
          ) : null}
        </div>
      }
    >
      <Button appearance="accent" size="sm" onClick={toggleContentVisibility}>
        {contentExpanded ? t("settings.developer.hide") : t("settings.developer.show")}
      </Button>
    </Row>
  );
};

export default FeaturesAndFlowsDevTool;
