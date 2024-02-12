import { Button, Flex, IconBox, IconsLegacy, Text } from "@ledgerhq/native-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "~/components/QueuedDrawer";

const OnboardingSetupDeviceInformation = ({
  open,
  onClose,
  onPress,
}: {
  open: boolean;
  onClose: () => void;
  onPress: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <QueuedDrawer isRequestingToBeOpened={open} onClose={onClose}>
      <Flex justifyContent="space-between">
        <Flex alignItems="center" justifyContent="center" mb={10}>
          <IconBox
            Icon={IconsLegacy.WarningMedium}
            color="warning.c50"
            iconSize={24}
            boxSize={64}
          />
          <Text variant="h2" color="neutral.c100" mt={8} uppercase textAlign="center">
            {t("onboarding.stepSetupDevice.start.warning.title")}
          </Text>
          <Text variant="paragraph" color="neutral.c80" mt={6} textAlign="center">
            {t("onboarding.stepSetupDevice.start.warning.desc")}
          </Text>
        </Flex>
        <Button
          type="main"
          size="large"
          onPress={onPress}
          testID="onboarding-stepSetupDevice-warning"
        >
          {t("onboarding.stepSetupDevice.start.warning.ctaText")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
};

export default OnboardingSetupDeviceInformation;
