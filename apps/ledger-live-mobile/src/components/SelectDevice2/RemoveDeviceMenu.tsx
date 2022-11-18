import React, { useCallback, useMemo } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { disconnect } from "@ledgerhq/live-common/hw/index";
import { useTheme } from "styled-components/native";
import { Flex } from "@ledgerhq/native-ui";

import Button from "../Button";

import NanoS from "../../images/devices/NanoS";
import NanoFTS from "../../images/devices/NanoFTS";
import NanoX from "../../images/devices/NanoX";

import Trash from "../../icons/Trash";
import BottomModal from "../BottomModal";
import { removeKnownDevice } from "../../actions/ble";

const illustrations = {
  nanoS: NanoS,
  nanoSP: NanoS,
  nanoX: NanoX,
  blue: NanoS,
  nanoFTS: NanoFTS,
};

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
  const { colors } = useTheme();

  const illustration = useMemo(
    () =>
      illustrations[device.modelId]({ color: colors.neutral.c100, size: 200 }),
    [device.modelId, colors],
  );

  const onRemoveDevice = useCallback(async () => {
    dispatch(removeKnownDevice(device.deviceId));
    onHideMenu();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await disconnect(device.deviceId).catch(() => {});
  }, [device, dispatch, onHideMenu]);

  return (
    <BottomModal isOpened={open} onClose={onHideMenu}>
      <Flex alignItems="center" mb={8}>
        {illustration}
      </Flex>
      <Button
        event="HardResetModalAction"
        type="alert"
        IconLeft={Trash}
        title={<Trans i18nKey="common.forgetDevice" />}
        onPress={onRemoveDevice}
      />
    </BottomModal>
  );
};

export default RemoveDeviceMenu;
