import React from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useTheme } from "styled-components/native";
import { renderConnectYourDevice as ConnectYourDevice } from "../../components/DeviceAction/rendering";
import QueuedDrawer from "../../components/QueuedDrawer";

export type Props = {
  isOpen: boolean;
  onPress?: () => void;
  /**
   * Callback triggered when the user closes the drawer (by clicking on the backdrop or the close button)
   * AND when the drawer is hidden.
   * This is currently due to a legacy behavior of the BaseModal component. It might change in the future.
   * You cannot know with just this callback if it's the user who closed the drawer.
   */
  onClose?: () => void;
  device: Device;
};

const UnlockDeviceDrawer: React.FC<Props> = ({ isOpen, device, onClose }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const theme = colors.type as "dark" | "light";

  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} preventBackdropClick>
      <Flex flexDirection="row">
        <ConnectYourDevice t={t} device={device} isLocked theme={theme} />
      </Flex>
    </QueuedDrawer>
  );
};

export default UnlockDeviceDrawer;
