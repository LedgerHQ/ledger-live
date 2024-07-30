import React, { useCallback } from "react";

import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { TRUSTCHAIN_APP_NAME } from "@ledgerhq/hw-trustchain";
import DeviceAction from "~/components/DeviceAction";
import { useSelector } from "react-redux";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { Flex } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

const request = {
  appName: TRUSTCHAIN_APP_NAME,
};

type Props = {
  goToFollowInstructions: (connectedDevice: Device) => void;
};

const DeviceActionForInstance = ({ goToFollowInstructions }: Props) => {
  const action = useAppDeviceAction();

  const device = useSelector(lastConnectedDeviceSelector);

  const onResult = useCallback(
    (payload: AppResult) => {
      goToFollowInstructions(payload.device);
    },
    [goToFollowInstructions],
  );

  if (!device) return;

  return (
    <Flex alignItems="center">
      <Flex flexDirection="row">
        <DeviceAction action={action} request={request} device={device} onResult={onResult} />
      </Flex>
    </Flex>
  );
};

export default DeviceActionForInstance;
