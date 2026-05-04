import React, { useCallback } from "react";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useSelector } from "~/context/hooks";
import { getDeviceIcon, type IconComponent } from "LLM/utils/getDeviceIcon";

export type TopBarActionIcon = {
  id: string;
  icon: IconComponent;
  callback: () => void;
  testID: string;
  accessibilityLabel: string;
  loading?: boolean;
  wrapper?: (children: React.ReactElement) => React.ReactElement;
};

export function useMyLedgerTopBarAction(onPress: () => void): TopBarActionIcon {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);

  const deviceIcon: IconComponent = useCallback(
    ({ size, style }) => getDeviceIcon(lastConnectedDevice, size, style),
    [lastConnectedDevice],
  );

  return {
    id: "my-ledger",
    icon: deviceIcon,
    callback: onPress,
    testID: "topbar-myledger",
    accessibilityLabel: "My Ledger",
  };
}
