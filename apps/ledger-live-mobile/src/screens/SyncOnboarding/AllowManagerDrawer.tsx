import React from "react";
import { useTranslation } from "react-i18next";
import { BottomDrawer, Flex } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useTheme } from "@react-navigation/native";
import { renderAllowManager as AllowManager } from "../../components/DeviceAction/rendering";

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
        <AllowManager
          t={t}
          wording="Ledger Live"
          device={device}
          theme={theme}
          colors={colors}
        />
      </Flex>
    </BottomDrawer>
  );
};

export default UnlockDeviceDrawer;
