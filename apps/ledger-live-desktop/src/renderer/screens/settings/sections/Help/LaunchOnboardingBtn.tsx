import React, { useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Track from "~/renderer/analytics/Track";
import Button from "~/renderer/components/Button";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";

const LaunchOnboardingBtn = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { shouldUseLazyOnboarding } = useWalletFeaturesConfig("desktop");

  const handleLaunchOnboarding = useCallback(() => {
    if (shouldUseLazyOnboarding) {
      navigate("/onboarding/select-device");
    } else {
      navigate("/onboarding");
    }
  }, [navigate, shouldUseLazyOnboarding]);

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
