import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import DeveloperOpenRow from "../components/DeveloperOpenRow";

const CustomLockScreenToggle = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const onNavigateToDebugScreen = useCallback(() => {
    navigate("/settings/developer/custom-locksscreen-assets");
  }, [navigate]);

  return (
    <DeveloperOpenRow
      title={t("settings.developer.customLockScreen")}
      desc={t("settings.developer.customLockScreenDesc")}
      cta={t("settings.developer.customLockScreenCTA")}
      onOpen={onNavigateToDebugScreen}
    />
  );
};

export default CustomLockScreenToggle;
