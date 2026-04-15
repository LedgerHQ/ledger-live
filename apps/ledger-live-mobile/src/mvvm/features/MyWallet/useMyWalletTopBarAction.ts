import { useCallback } from "react";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useSelector } from "~/context/hooks";
import { getDeviceIcon, type IconComponent } from "LLM/utils/getDeviceIcon";
import type { TopBarActionIcon } from "LLM/components/CustomTopBar";

export function useMyWalletTopBarAction(onPress: () => void): TopBarActionIcon {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);

  const deviceIcon: IconComponent = useCallback(
    ({ size, style }) => getDeviceIcon(lastConnectedDevice, size, style),
    [lastConnectedDevice],
  );

  return {
    id: "my-wallet",
    icon: deviceIcon,
    callback: onPress,
    testID: "topbar-mywallet",
    accessibilityLabel: "My Wallet",
  };
}
