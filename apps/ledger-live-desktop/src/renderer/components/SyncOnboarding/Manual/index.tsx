import React, { ReactNode, useEffect, useState } from "react";
import { Button, Flex, Text, VerticalTimeline } from "@ledgerhq/react-ui";
import { CloseMedium, HelpMedium } from "@ledgerhq/react-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useOnboardingStatePolling } from "@ledgerhq/live-common/onboarding/hooks/useOnboardingStatePolling";
import { command } from "~/renderer/commands";
import LangSwitcher from "~/renderer/components/Onboarding/LangSwitcher";
import { useHistory, useRouteMatch } from "react-router-dom";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { DeviceModelId } from "@ledgerhq/devices";

import nanoX from "~/renderer/images/nanoX.v3.svg";
import nanoXDark from "~/renderer/images/nanoXDark.v3.svg";
import Illustration from "~/renderer/components/Illustration";
import HelpDrawer from "./HelpDrawer";
import TroubleshootingDrawer from "./TroubleshootingDrawer";
import GenuineCheckModal from "./GenuineCheckModal";
import SoftwareCheckContent from "./SoftwareCheckContent";
import RecoveryContent from "./RecoveryContent";

const readyRedirectDelay = 2500;

enum StepKey {
  Paired = 0,
  Pin,
  Seed,
  SoftwareCheck,
  Applications,
  Ready,
  Exit,
}

type StepStatus = "completed" | "active" | "inactive";

type Step = {
  key: StepKey;
  status: StepStatus;
  title: string;
  estimatedTime?: number;
  renderBody?: () => ReactNode;
};

const SyncOnboardingManual = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const defaultSteps: Step[] = [
    {
      key: StepKey.Paired,
      status: "active",
      title: "Nano is connected",
      renderBody: () => (
        <Text>
          {`Continue setup on Nano This screen will change dynamically to provide you with relevant information while you set up Nano`}
        </Text>
      ),
    },
    {
      key: StepKey.Pin,
      status: "inactive",
      title: "Set your PIN",
      renderBody: () => (
        <Text>
          {`Your PIN can be 4 to 8 digits long. Anyone with access to your Nano and to your PIN can also access all your crypto and NFT assets.`}
        </Text>
      ),
      estimatedTime: 120,
    },
    {
      key: StepKey.Seed,
      status: "inactive",
      title: t("syncOnboarding.manual.recoveryContent.title"),
      renderBody: () => <RecoveryContent />,
      estimatedTime: 300,
    },
    {
      key: StepKey.SoftwareCheck,
      status: "active",
      title: t("syncOnboarding.manual.softwareCheckContent.title"),
      renderBody: () => (
        <SoftwareCheckContent
          genuineCheckStatus="completed"
          firmwareUpdateStatus="updateAvailable"
        />
      ),
    },
    {
      key: StepKey.Applications,
      status: "inactive",
      title: "Nano applications",
      renderBody: () => <Text>{`Nano uses apps to enable secure blockchain transactions`}</Text>,
    },
    {
      key: StepKey.Ready,
      status: "inactive",
      title: "Nano is ready",
    },
  ];

  const [steps, setSteps] = useState<Step[]>(defaultSteps);
  const [stepKey, setStepKey] = useState<StepKey>(StepKey.Paired);

  const device = useSelector(getCurrentDevice);

  const {
    onboardingState: deviceOnboardingState,
    allowedError,
    // fatalErrorItem,
  } = useOnboardingStatePolling({
    getOnboardingStatePolling: command("getOnboardingStatePolling"),
    device,
    pollingPeriodMs: 2000,
  });
  console.log(`🦄 Manual onboarding polling = ${JSON.stringify(deviceOnboardingState)}`);

  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [isTroubleshootingDrawerOpen, setTroubleshootingDrawerOpen] = useState<boolean>(false);
  const [isGenuineCheckModalOpen, setGenuineCheckModalOpen] = useState<boolean>(true);
  const [lastKnownDeviceId, setLastKnownDeviceId] = useState<DeviceModelId>(DeviceModelId.nanoX);

  useEffect(() => {
    if (stepKey === StepKey.Ready) {
      setTimeout(() => setStepKey(StepKey.Exit), readyRedirectDelay / 2);
    }

    if (stepKey === StepKey.Exit) {
      setTimeout(() => history.push(`/sync-onboarding/completion`), readyRedirectDelay / 2);
    }
  }, [history, stepKey]);

  useEffect(() => {
    if (device) {
      setLastKnownDeviceId(device.modelId);
    }
  }, [device]);

  return (
    <Flex bg="background.main" width="100%" height="100%" flexDirection="column">
      <HelpDrawer isOpen={isHelpDrawerOpen} onClose={() => setHelpDrawerOpen(false)} />
      <TroubleshootingDrawer
        lastKnownDeviceId={lastKnownDeviceId}
        isOpen={isTroubleshootingDrawerOpen}
        onClose={() => setTroubleshootingDrawerOpen(false)}
      />
      <GenuineCheckModal
        isOpen={isGenuineCheckModalOpen}
        onClose={() => setGenuineCheckModalOpen(false)}
      />
      <Flex width="100%" justifyContent="flex-end" mt={4} px={4}>
        <LangSwitcher />
        <Button ml={4} Icon={CloseMedium} />
      </Flex>
      <Flex flex={1} px={8} py={4} alignItems="center">
        <Flex flex={1} flexDirection="column">
          <Flex alignItems="center" mb={8}>
            <Text variant="h4" fontSize="24px" fontWeight="semiBold">
              Setup Manual
            </Text>
            <Button
              ml={4}
              Icon={() => <HelpMedium color="neutral.c80" size={24} />}
              onClick={() => setHelpDrawerOpen(true)}
            />
          </Flex>
          <VerticalTimeline steps={steps as any} />
        </Flex>
        <Flex flex={1} justifyContent="center" alignItems="center">
          <Illustration
            style={{
              height: 540,
              width: 240,
              backgroundSize: "contain",
            }}
            lightSource={nanoX}
            darkSource={nanoXDark}
          />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default SyncOnboardingManual;
