import React from "react";
import CollapsibleStep from "./CollapsibleStep";
import { useTranslation } from "react-i18next";
import InstallSetOfApps from "~/components/DeviceAction/InstallSetOfApps";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CompanionStep } from "./TwoStepSyncOnboardingCompanion";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import BackgroundBlue from "../assets/BackgroundBlue";
import { Box } from "@ledgerhq/native-ui";

const fallbackDefaultAppsToInstall = ["Bitcoin", "Ethereum", "Polygon"];

interface SecondStepSyncOnboardingProps {
  device: Device;
  companionStep: CompanionStep;
  isCollapsed: boolean;
  handleDone: () => void;
}

const SecondStepSyncOnboarding = ({
  device,
  companionStep,
  isCollapsed,
  handleDone,
}: SecondStepSyncOnboardingProps) => {
  const { t } = useTranslation();
  const deviceInitialApps = useFeature("deviceInitialApps");
  const initialAppsToInstall = deviceInitialApps?.params?.apps || fallbackDefaultAppsToInstall;

  return (
    <CollapsibleStep
      isCollapsed={isCollapsed}
      title={t("syncOnboarding.secureCryptoStep.title")}
      status="unfinished"
      background={<BackgroundBlue />}
    >
      <Box mt={3}>
        <InstallSetOfApps
          isNewSeed={companionStep === "new_seed"}
          restore={companionStep === "restore"}
          device={device}
          onResult={handleDone}
          dependencies={initialAppsToInstall}
        />
      </Box>
    </CollapsibleStep>
  );
};

export default SecondStepSyncOnboarding;
