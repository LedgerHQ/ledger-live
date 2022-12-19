import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Popin, Text } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/devices";
import { useTheme } from "styled-components";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";

export type Props = {
  isOpen: boolean;
  deviceId: DeviceModelId;
  animationName: "enterPinCode" | "allowManager";
  productName: string;
};

const GenuineCheckAnimationModal = ({ isOpen, deviceId, animationName, productName }: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();

  let title: string;
  // As long as we don't have full TS support on LLD, a default case needs to be handled and animationName value cannot be trusted
  switch (animationName) {
    case "enterPinCode":
      title = t("syncOnboarding.manual.genuineCheckAnimationModal.enterPinCode.title", {
        deviceName: productName,
      });
      break;
    case "allowManager":
    default:
      title = t("syncOnboarding.manual.genuineCheckAnimationModal.allowManager.title", {
        deviceName: productName,
      });
      break;
  }

  return (
    <Popin position="relative" isOpen={isOpen}>
      <Flex flexDirection="column" alignItems="center" height="100%" px={8} py={16}>
        <Text variant="h4Inter" fontWeight="semiBold">
          {title}
        </Text>
        <Animation
          animation={getDeviceAnimation(deviceId, theme.theme as "light" | "dark", animationName)}
        />
      </Flex>
    </Popin>
  );
};

export default GenuineCheckAnimationModal;
