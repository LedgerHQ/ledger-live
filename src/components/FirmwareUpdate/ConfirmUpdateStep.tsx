import { Flex, Text, Log } from "@ledgerhq/native-ui";
import React from "react";
import Animation from "../Animation";
import getDeviceAnimation from "../DeviceAction/getDeviceAnimation";
import { useTranslation } from "react-i18next";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { DeviceInfo } from "@ledgerhq/live-common/lib/types/manager";
import { useTheme } from "styled-components/native";

type Props = {
  device: Device;
  deviceInfo: DeviceInfo;
  firmwareVersion: string;
};

const ConfirmUpdateStep = ({ device, deviceInfo, firmwareVersion }: Props) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <Flex alignItems="center">
      <Animation
        source={getDeviceAnimation({
          device,
          key: "validate",
          theme: theme as "light" | "dark" | undefined,
        })}
      />
      <Flex border={1} borderColor="neutral.c80" borderRadius={3} px={2} mt={4}>
        <Text variant="subtitle" color="neutral.c80" p={0} m={0}>
          {device.deviceName}
        </Text>
      </Flex>
      <Flex mt={7}>
        <Log>{t("FirmwareUpdate.pleaseConfirmUpdate")}</Log>
      </Flex>
      <Flex
        grow={1}
        justifyContent="space-between"
        flexDirection="row"
        alignSelf="stretch"
        mt={10}
      >
        <Text variant="subtitle" color="neutral.c80">
          {t("FirmwareUpdate.currentVersionNumber")}
        </Text>
        <Text variant="subtitle">{deviceInfo.version}</Text>
      </Flex>
      <Flex
        grow={1}
        justifyContent="space-between"
        flexDirection="row"
        alignSelf="stretch"
        mt={5}
        mb={5}
      >
        <Text variant="subtitle" color="neutral.c80">
          {t("FirmwareUpdate.newVersionNumber")}
        </Text>
        <Text variant="subtitle">{firmwareVersion}</Text>
      </Flex>
    </Flex>
  );
};

export default ConfirmUpdateStep;