import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "~/context/hooks";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { disconnect } from "@ledgerhq/live-common/hw/index";
import { Flex } from "@ledgerhq/native-ui";

import Button from "../Button";
import Trash from "~/icons/Trash";
import QueuedDrawer from "~/components/QueuedDrawer";
import { removeKnownDevice } from "~/actions/ble";
import { DeviceIllustration } from "~/components/DeviceIllustration";

const RemoveDeviceMenu = ({
  onHideMenu,
  device,
  open,
}: {
  onHideMenu: () => void;
  device: Device;
  open: boolean;
}) => {
  const dispatch = useDispatch();

  const onRemoveDevice = useCallback(async () => {
    dispatch(removeKnownDevice(device.deviceId));
    onHideMenu();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await disconnect(device.deviceId).catch(() => {});
  }, [device, dispatch, onHideMenu]);

  return (
    <QueuedDrawer isRequestingToBeOpened={open} onClose={onHideMenu}>
      <Flex alignItems="center" mb={8}>
        <DeviceIllustration deviceModelId={device.modelId} />
      </Flex>
      <Button
        event="HardResetModalAction"
        type="alert"
        IconLeft={Trash}
        title={<Trans i18nKey="common.forgetDevice" />}
        onPress={onRemoveDevice}
      />
    </QueuedDrawer>
  );
};

export default RemoveDeviceMenu;
