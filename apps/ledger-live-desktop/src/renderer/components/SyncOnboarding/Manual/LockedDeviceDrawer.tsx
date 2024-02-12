import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { useTheme } from "styled-components";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { DeviceBlocker } from "../../DeviceAction/DeviceBlocker";

export type Props = {
  deviceModelId: DeviceModelId;
};

const LockedDeviceDrawer = ({ deviceModelId }: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const productName = getDeviceModel(deviceModelId).productName;

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
      <DeviceBlocker />
    </Flex>
  );
};

export default withV3StyleProvider(LockedDeviceDrawer);
