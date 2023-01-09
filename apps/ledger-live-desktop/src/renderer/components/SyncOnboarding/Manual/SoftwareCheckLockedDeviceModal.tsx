import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Popin, Text } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/devices";
import { useTheme } from "styled-components";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";

export type Props = {
  isOpen: boolean;
  deviceModelId: DeviceModelId;
  productName: string;
  onClose?: () => void;
};

const SoftwareCheckLockedDeviceModal = ({ isOpen, deviceModelId, productName, onClose }: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Popin position="relative" isOpen={isOpen}>
      <Popin.Header onClose={onClose}>
        <></>
      </Popin.Header>
      <Flex flexDirection="column" alignItems="center" height="100%" px={8} py={16}>
        <Text variant="h4Inter" fontWeight="semiBold">
          {t("syncOnboarding.manual.softwareCheckLockedDeviceModal.title", {
            deviceName: productName,
          })}
        </Text>
        <Animation animation={getDeviceAnimation(deviceModelId, theme.theme, "enterPinCode")} />
      </Flex>
    </Popin>
  );
};

export default SoftwareCheckLockedDeviceModal;
