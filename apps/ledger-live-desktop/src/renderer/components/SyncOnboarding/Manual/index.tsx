import React, { useState } from "react";
import { Button, Flex, Text, VerticalTimeline } from "@ledgerhq/react-ui";
import { CloseMedium, HelpMedium } from "@ledgerhq/react-ui/assets/icons";
import { useTranslation } from "react-i18next";
import LangSwitcher from "~/renderer/components/Onboarding/LangSwitcher";

import nanoX from "~/renderer/images/nanoX.v3.svg";
import nanoXDark from "~/renderer/images/nanoXDark.v3.svg";
import Illustration from "~/renderer/components/Illustration";
import HelpDrawer from "./HelpDrawer";
import GeniuneCheckPopin from "./GeniuneCheckPopin";

import { SoftwareCheckContent } from "./SoftwareCheckStep";

const SyncOnboardingManual = () => {
  const steps = [
    {
      status: "completed",
      title: "Nano is connected",
      renderBody: () => (
        <Text>
          {`Continue setup on Nano This screen will change dynamically to provide you with relevant information while you set up Nano`}
        </Text>
      ),
    },
    {
      status: "completed",
      title: "Set your PIN",
      renderBody: () => (
        <Text>
          {`Your PIN can be 4 to 8 digits long. Anyone with access to your Nano and to your PIN can also access all your crypto and NFT assets.`}
        </Text>
      ),
      estimatedTime: 120,
    },
    {
      status: "completed",
      title: "Recovery phrase",
      renderBody: () => (
        <Text>{`Tap on the videos below to learn more about your secret recovery phrase`}</Text>
      ),
      estimatedTime: 300,
    },
    {
      status: "active",
      title: "Software check",
      renderBody: () => (
        <SoftwareCheckContent genuineCheckStatus="active" firmwareUpdateStatus="inactive" />
      ),
    },
    {
      status: "inactive",
      title: "Nano applications",
      renderBody: () => <Text>{`Nano uses apps to enable secure blockchain transactions`}</Text>,
    },
    {
      status: "inactive",
      title: "Nano is ready",
    },
  ];

  const { t } = useTranslation();
  const [isHelpDrawerOpen, setHelpDrawerOpen] = useState<boolean>(false);
  const [isGeniuneCheckPopinOpen, setGeniuneCheckPopinOpen] = useState<boolean>(true);

  return (
    <Flex bg="background.main" width="100%" height="100%" flexDirection="column">
      <HelpDrawer isOpen={isHelpDrawerOpen} onClose={() => setHelpDrawerOpen(false)} />
      <GeniuneCheckPopin
        isOpen={isGeniuneCheckPopinOpen}
        onClose={() => setGeniuneCheckPopinOpen(false)}
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
