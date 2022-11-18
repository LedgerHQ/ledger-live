import React from "react";
import { useTranslation } from "react-i18next";
import { BottomDrawer, Flex } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTheme } from "styled-components/native";
import { renderConnectYourDevice as ConnectYourDevice } from "../../components/DeviceAction/rendering";

export type Props = {
  isOpen: boolean;
  onPress?: () => void;
  onClose?: () => void;
  device: Device;
};

const UnlockDeviceDrawer = ({ isOpen, device, onClose }: Props) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = colors.type as "dark" | "light";

  return (
    <BottomDrawer
      isOpen={isOpen}
      onClose={onClose}
      preventBackdropClick
      noCloseButton
    >
      <Flex mb={250} pt={120}>
        <ConnectYourDevice
          t={t}
          device={device}
          unresponsive={true}
          theme={theme}
        />
      </Flex>
    </BottomDrawer>
  );
};

export default UnlockDeviceDrawer;
