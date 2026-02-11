import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@ledgerhq/lumen-ui-react";
import { FeatureFlagPreviewProps } from "../types";

export const FeatureFlagPreview = ({ featureFlag }: FeatureFlagPreviewProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <Button appearance="transparent" size="sm" onClick={toggleExpanded}>
        {isExpanded
          ? t("settings.developer.walletFeaturesDevTool.hideJson")
          : t("settings.developer.walletFeaturesDevTool.showJson")}
      </Button>
      {isExpanded && (
        <div className="overflow-x-auto rounded-md bg-canvas-muted p-4">
          <pre className="body-3 text-muted">{JSON.stringify(featureFlag, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
