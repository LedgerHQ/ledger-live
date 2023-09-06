import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui";
import { DeviceModelId } from "@ledgerhq/devices";
import { useTheme } from "styled-components";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { DeviceBlocker } from "../../../DeviceAction/DeviceBlocker";

export type Props = {
  deviceModelId: DeviceModelId;
};

const SoftwareCheckAllowSecureChannelDrawer = ({ deviceModelId }: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Flex flexDirection="column" alignItems="center" justifyContent="center" height="100%">
      <Animation
        animation={getDeviceAnimation(deviceModelId, theme.theme, "allowManager") as object}
      />
      <Text variant="h5Inter" fontWeight="semiBold" mt={6}>
        {t("syncOnboarding.manual.softwareCheckAllowSecureChannelDrawer.title")}
      </Text>
      <DeviceBlocker />
    </Flex>
  );
};

export default SoftwareCheckAllowSecureChannelDrawer;
