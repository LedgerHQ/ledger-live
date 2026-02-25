import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import { QuickActionsProps } from "../types";

export const QuickActions = ({
  allEnabled,
  isEnabled,
  onEnableAll,
  onDisableAll,
}: QuickActionsProps) => {
  const { t } = useTranslation();

  return (
    <div className="flex gap-4">
      <Button appearance="accent" size="sm" onClick={onEnableAll} disabled={allEnabled}>
        {t("settings.developer.walletFeaturesDevTool.enableAll")}
      </Button>
      <Button appearance="base" size="sm" onClick={onDisableAll} disabled={!isEnabled}>
        {t("settings.developer.walletFeaturesDevTool.disableAll")}
      </Button>
    </div>
  );
};
