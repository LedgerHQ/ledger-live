import React from "react";
import { useTranslation } from "react-i18next";
import { BottomDrawer, Flex } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTheme } from "styled-components/native";
import { renderAllowManager as AllowManager } from "../../components/DeviceAction/rendering";

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
      <Flex mb={200} pt={50}>
        <AllowManager
          t={t}
          wording={t(
            "syncOnboarding.softwareChecksSteps.allowManagerDrawer.wording",
          )}
          device={device}
          theme={theme}
          colors={colors}
        />
      </Flex>
    </BottomDrawer>
  );
};

export default UnlockDeviceDrawer;
