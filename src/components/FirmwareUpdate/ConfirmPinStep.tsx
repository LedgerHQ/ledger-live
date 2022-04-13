import { Flex, Text, Log, NumberedList } from "@ledgerhq/native-ui";
import React, { useEffect } from "react";
import Animation from "../Animation";
import getDeviceAnimation from "../DeviceAction/getDeviceAnimation";
import { useTranslation } from "react-i18next";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useTheme } from "styled-components/native";
import { track } from "../../analytics";

type Props = {
  device: Device;
};

const ConfirmPinStep = ({ device }: Props) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  useEffect(() => {
    track("FirmwareUpdateConfirmPin");
  }, []);

  return (
    <Flex alignItems="center">
      <Animation
        source={getDeviceAnimation({
          device,
          key: "enterPinCode",
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
        border={1}
        borderColor="neutral.c80"
        alignSelf="stretch"
        px={6}
        pt={6}
        borderRadius={5}
        mt={10}
      >
        <NumberedList
          items={[
            {
              description: t("FirmwareUpdate.waitForFirmwareUpdate"),
            },
            {
              description: t("FirmwareUpdate.unlockDeviceWithPin"),
            },
          ]}
          itemContainerProps={{}}
        />
      </Flex>
    </Flex>
  );
};

export default ConfirmPinStep;
