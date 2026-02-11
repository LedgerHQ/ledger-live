import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { WalletFeaturesDevToolContent } from "./WalletFeaturesDevToolContent";
import DeveloperExpandableRow from "../../components/DeveloperExpandableRow";

const WalletFeaturesDevTool = () => {
  const { t } = useTranslation();
  const [contentExpanded, setContentExpanded] = useState(false);

  const toggleContentVisibility = useCallback(() => {
    setContentExpanded(prev => !prev);
  }, []);

  return (
    <DeveloperExpandableRow
      title={t("settings.developer.walletFeaturesDevTool.title")}
      desc={<WalletFeaturesDevToolContent expanded={contentExpanded} />}
      expanded={contentExpanded}
      onToggle={toggleContentVisibility}
      childrenAlignSelf="flex-start"
    />
  );
};

export default WalletFeaturesDevTool;
