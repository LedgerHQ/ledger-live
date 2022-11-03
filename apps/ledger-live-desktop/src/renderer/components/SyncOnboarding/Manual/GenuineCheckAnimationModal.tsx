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
  animationName: string;
  productName: string;
};

const GenuineCheckModal = ({ isOpen, deviceId, animationName, productName }: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Popin position="relative" isOpen={isOpen}>
      <Flex flexDirection="column" alignItems="center" height="100%" px={8} py={16}>
        <Text variant="h4Inter" fontWeight="semiBold">
          {t("syncOnboarding.manual.genuineCheckAnimationModal.message", {
            deviceName: productName,
          })}
        </Text>
        <Animation
          animation={getDeviceAnimation(deviceId, theme.theme as "light" | "dark", animationName)}
        />
      </Flex>
    </Popin>
  );
};

export default GenuineCheckModal;
