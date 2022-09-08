import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { disconnect } from "@ledgerhq/live-common/hw/index";

import Button from "../Button";

import Illustration from "../../images/illustration/Illustration";
import Trash from "../../icons/Trash";
import BottomModal from "../BottomModal";
import ModalBottomAction from "../ModalBottomAction";
import { removeKnownDevice } from "../../actions/ble";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const darkImg = require("../../images/illustration/Dark/_079.png");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lightImg = require("../../images/illustration/Light/_079.png");

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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await disconnect(device.deviceId).catch(() => {});
  }, [device, dispatch]);

  return (
    <BottomModal id="DeviceItemModal" isOpened={open} onClose={onHideMenu}>
      <ModalBottomAction
        icon={
          <Illustration
            size={100}
            darkSource={darkImg}
            lightSource={lightImg}
          />
        }
        title={device.deviceName}
        uppercase={false}
        footer={
          <Button
            event="HardResetModalAction"
            type="alert"
            IconLeft={Trash}
            title={<Trans i18nKey="common.forgetDevice" />}
            onPress={onRemoveDevice}
          />
        }
      />
    </BottomModal>
  );
};

export default RemoveDeviceMenu;
