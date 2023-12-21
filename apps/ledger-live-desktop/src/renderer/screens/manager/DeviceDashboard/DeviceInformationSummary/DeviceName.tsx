import React, { useState, useCallback } from "react";
import { Flex, IconsLegacy, Text } from "@ledgerhq/react-ui";
import EditDeviceName from "./EditDeviceName";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { identifyTargetId, DeviceModelId } from "@ledgerhq/devices";
import { DeviceInfo } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { setDrawer } from "~/renderer/drawers/Provider";
import styled from "styled-components";
import ToolTip from "~/renderer/components/Tooltip";
import { useTranslation } from "react-i18next";

type Props = {
  deviceInfo: DeviceInfo;
  deviceName: string;
  onRefreshDeviceInfo: () => void;
  setPreventResetOnDeviceChange: (state: boolean) => void;
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
  setPreventResetOnDeviceChange,
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
    // Prevents manager from reacting to device changes
    setPreventResetOnDeviceChange(true);

    name &&
      setDrawer(
        EditDeviceName,
        {
          key: name,
          device,
          onSetName: onSuccess,
          deviceName: name,
          deviceInfo,
        },
        {
          onRequestClose: () => {
            setPreventResetOnDeviceChange(false);
            setDrawer();
          },
        },
      );
    track("Page Manager RenameDeviceEntered");
  }, [device, deviceInfo, name, onSuccess, setPreventResetOnDeviceChange]);

  const { t } = useTranslation();

  return (
    <Flex alignItems="center">
      <Flex onClick={!disabled ? openDeviceRename : undefined}>
        <Flex mb={2} alignItems="center">
          <Text variant="large" fontWeight="semiBold" mr={3}>
            {name || deviceInfo.version}
          </Text>
          {editSupported ? (
            <ToolTip
              enabled={disabled}
              content={
                <Text color="neutral.c00" variant="small">
                  {t("appsInstallingDisabledTooltip")}
                </Text>
              }
              placement="top"
            >
              <PenIcon>
                <IconsLegacy.PenMedium
                  color={disabled ? "neutral.c50" : "neutral.c100"}
                  size={17}
                />
              </PenIcon>
            </ToolTip>
          ) : null}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default withV3StyleProvider(DeviceName);
