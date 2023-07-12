import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/devices";
import { useTheme } from "styled-components";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";

export type Props = {
  deviceModelId: DeviceModelId;
  productName: string;
};

const SoftwareCheckLockedDeviceDrawer = ({ deviceModelId, productName }: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" height="100%">
      <Animation
        animation={getDeviceAnimation(deviceModelId, theme.theme, "enterPinCode") as object}
      />
      <Text variant="h5Inter" fontWeight="semiBold" mt={6}>
        {t("syncOnboarding.manual.softwareCheckLockedDeviceDrawer.title", {
          deviceName: productName,
        })}
      </Text>
    </Flex>
  );
};

export default SoftwareCheckLockedDeviceDrawer;
