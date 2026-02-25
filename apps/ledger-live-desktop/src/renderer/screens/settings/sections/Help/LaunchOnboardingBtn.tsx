import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Track from "~/renderer/analytics/Track";
import Button from "~/renderer/components/Button";

const LaunchOnboardingBtn = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLaunchOnboarding = useCallback(() => {
    navigate("/onboarding");
  }, [navigate]);

  return (
    <>
      <Track onUpdate event={"Launch Onboarding from Settings"} />
      <Button primary small onClick={handleLaunchOnboarding}>
        {t("common.launch")}
      </Button>
    </>
  );
};

export default LaunchOnboardingBtn;
