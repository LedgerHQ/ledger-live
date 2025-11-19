import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { ConnectYourDevice } from "./DeviceAction/rendering";
import QueuedDrawer from "./QueuedDrawer";

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
  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose} preventBackdropClick>
      <Flex flexDirection="row">
        <ConnectYourDevice device={device} isLocked />
      </Flex>
    </QueuedDrawer>
  );
};

export default UnlockDeviceDrawer;
