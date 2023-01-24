import React, { useCallback, useState } from "react";
import { Button, Flex, Text, Toggle, VerticalTimeline } from "@ledgerhq/react-ui";

import ButtonV2 from "~/renderer/components/Button";
import { setDrawer } from "~/renderer/drawers/Provider";
import OnboardingAppInstallStep from "~/renderer/components/OnboardingAppInstall";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const OnboardingAppInstallDebugScreen = () => {
  const [restore, setRestore] = useState<boolean>(false);
  const [componentKey, setComponentKey] = useState<number>(1);

  const steps = [
    {
      key: 0,
      status: "completed",
      title: "Seed your device",
    },
    {
      key: 1,
      estimatedTime: 120,
      status: "active",
      title: "Install default set of apps",
      renderBody: () => (
        <OnboardingAppInstallStep
          restore={restore}
          productName="Ledger Stax"
          restoreDeviceName="Ledger Nano X"
        />
      ),
    },
    {
      key: 2,
      status: "inactive",
      title: "Complete onboarding",
    },
  ];

  return (
    <Flex px={12} flexDirection="column">
      <Text variant="h2" fontWeight="semiBold">
        Onboarding apps installer
      </Text>
      <Flex mt={8}>
        <Button
          mr={6}
          variant="main"
          outline={true}
          onClick={() => setComponentKey(componentKey + 1)}
        >
          Remount component
        </Button>
        <Toggle checked={!restore} onClick={() => setRestore(!restore)}>
          Toggle restore
        </Toggle>
      </Flex>
      <Flex py={12} flex={1}>
        <VerticalTimeline key={componentKey} flex={1} steps={steps} />
      </Flex>
    </Flex>
  );
};

const StyledOnboardingAppInstallDebugScreen = withV3StyleProvider(OnboardingAppInstallDebugScreen);

const OnboardingAppInstallDebugButton = () => {
  const handleOpenDebugScreen = useCallback(() => {
    setDrawer(StyledOnboardingAppInstallDebugScreen, {}, { style: { maxWidth: "640px" } });
  }, []);

  return (
    <ButtonV2 small primary onClick={handleOpenDebugScreen}>
      Open
    </ButtonV2>
  );
};

export default OnboardingAppInstallDebugButton;
