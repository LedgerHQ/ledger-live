import React, { useState, useCallback } from "react";
import { Flex, Icons } from "@ledgerhq/react-ui";
import Text from "~/renderer/components/Text";
import EditDeviceName from "./EditDeviceName";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { identifyTargetId, DeviceModelId } from "@ledgerhq/devices";
import { DeviceInfo } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { setDrawer } from "~/renderer/drawers/Provider";
import styled from "styled-components";

type Props = {
  deviceInfo: DeviceInfo;
  deviceName: string;
  onRefreshDeviceInfo: () => void;
  device: Device;
  disabled?: boolean;
};

const PenIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const DeviceName: React.FC<Props> = ({
  deviceName,
  deviceInfo,
  device,
  disabled,
  onRefreshDeviceInfo,
}: Props) => {
  const model = identifyTargetId(deviceInfo.targetId as number);
  const editSupported = model?.id && [DeviceModelId.stax, DeviceModelId.nanoX].includes(model.id);

  const [name, setName] = useState(editSupported ? deviceName : model?.productName);

  const onSuccess = useCallback(
    (deviceName: string) => {
      track("Page Manager RenamedDevice", { deviceName });
      setName(deviceName);
      onRefreshDeviceInfo();
    },
    [onRefreshDeviceInfo],
  );

  const openDeviceRename = useCallback(() => {
    name &&
      setDrawer(EditDeviceName, {
        key: name,
        device,
        onSetName: onSuccess,
        deviceName: name,
        deviceInfo,
      });
    track("Page Manager RenameDeviceEntered");
  }, [device, deviceInfo, name, onSuccess]);

  return (
    <Flex alignItems="center">
      <Flex onClick={!disabled ? openDeviceRename : undefined}>
        <Flex mb={2} alignItems="center">
          <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={6} mr={3}>
            {name || deviceInfo.version}
          </Text>
          {editSupported ? (
            <PenIcon>
              <Icons.PenMedium color={disabled ? "neutral.c50" : "neutral.c100"} size={17} />
            </PenIcon>
          ) : null}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default withV3StyleProvider(DeviceName);
