import React from "react";
import { useTranslation } from "react-i18next";
import { BottomDrawer, Flex } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useTheme } from "@react-navigation/native";
import { renderConnectYourDevice as ConnectYourDevice } from "../../components/DeviceAction/rendering";

export type Props = {
  isOpen: boolean;
  onPress?: () => void;
  device: Device;
};

const UnlockDeviceDrawer = ({ isOpen, device }: Props) => {
  const { t } = useTranslation();
  const { colors, dark } = useTheme();
  const theme = dark ? "dark" : "light";

  return (
    <BottomDrawer isOpen={isOpen} preventBackdropClick noCloseButton>
      <Flex mb={300} pt={80}>
        <ConnectYourDevice
          t={t}
          device={device}
          unresponsive={true}
          theme={theme}
          colors={colors}
        />
      </Flex>
    </BottomDrawer>
  );
};

export default UnlockDeviceDrawer;
