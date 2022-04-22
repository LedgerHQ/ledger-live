import React, { memo, useMemo, useCallback } from "react";
import invariant from "invariant";
import { TouchableOpacity } from "react-native";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import {
  NanoFoldedMedium,
  ToolsMedium,
  OthersMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { SelectableList, Text } from "@ledgerhq/native-ui";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";

type Props = {
  deviceMeta: Device;
  disabled?: boolean;
  withArrow?: boolean;
  description?: React.ReactNode;
  onSelect?: (arg0: Device) => any;
  onBluetoothDeviceAction?: (arg0: Device) => any;
};

const iconByFamily: Record<string, IconType> = {
  httpdebug: ToolsMedium,
};

function DeviceItem({
  deviceMeta,
  onSelect,
  disabled,
  description,
  onBluetoothDeviceAction,
}: Props) {
  const onPress = useCallback(() => {
    invariant(onSelect, "onSelect required");
    return onSelect(deviceMeta);
  }, [deviceMeta, onSelect]);

  const family = deviceMeta.deviceId.split("|")[0];
  const CustomIcon = !!family && iconByFamily[family];

  const onMore = useMemo(
    () =>
      family !== "usb" && !!onBluetoothDeviceAction
        ? () => onBluetoothDeviceAction(deviceMeta)
        : undefined,
    [family, onBluetoothDeviceAction, deviceMeta],
  );

  const renderOnMore = (
    <TouchableOpacity onPress={onMore} disabled={disabled}>
      <OthersMedium
        size={24}
        color={disabled ? "neutral.c50" : "neutral.c100"}
      />
    </TouchableOpacity>
  );

  return (
    <SelectableList.Element
      onPress={onPress}
      Icon={CustomIcon || NanoFoldedMedium}
      renderRight={onMore ? renderOnMore : undefined}
      disabled={disabled}
    >
      {deviceMeta.deviceName}
      {description && (
        <Text color={disabled ? "neutral.c50" : "neutral.c100"}>
          {" "}
          ({description})
        </Text>
      )}
    </SelectableList.Element>
  );
}

export default memo<Props>(DeviceItem);
