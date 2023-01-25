import React, { useState, useCallback } from "react";
import { Flex, Icons } from "@ledgerhq/react-ui";
import Text from "~/renderer/components/Text";
import EditDeviceName from "./EditDeviceName";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
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
};

const PenIcon = styled.div`
  display: flex;
  border-radius: 999px;
  background: ${p => p.theme.colors.blueTransparentBackground};
  align-items: center;
  justify-content: center;
  height: 32px;
  width: 32px;
`;

const DeviceName: React.FC<Props> = ({
  deviceName,
  deviceInfo,
  device,
  onRefreshDeviceInfo,
}: Props) => {
  const [name, setName] = useState(deviceName);

  const onSuccess = useCallback(() => {
    track("Page Manager RenamedDevice", { deviceName });
    onRefreshDeviceInfo();
  }, [deviceName, onRefreshDeviceInfo]);

  const openDeviceRename = useCallback(() => {
    setDrawer(EditDeviceName, {
      key: name,
      device,
      onSetName: setName,
      deviceName: name,
      onSuccess,
    });
    track("Page Manager RenameDeviceEntered");
  }, [device, name, onSuccess]);

  return (
    <Flex alignItems="center">
      <Flex onClick={openDeviceRename}>
        <Flex mb={2} alignItems="center">
          <Text ff="Inter|SemiBold" color="palette.text.shade100" fontSize={6} mr={3}>
            {name || deviceInfo.version}
          </Text>
          <PenIcon>
            <Icons.PenMedium color="primary.c90" size={17} />
          </PenIcon>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default withV3StyleProvider(DeviceName);
