import React, { useCallback, useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { OsUpdatePortsProvider, type OsUpdateDevice } from "@features/flow-device-os-update";
import { OsUpdateFlow } from "@features/flow-device-os-update/native";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import type { BaseNavigation, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ScreenName } from "~/const";
import { toMyLedgerDevice, toOsUpdateDevice } from "../../ports/osUpdateDevice";
import { useOsUpdatePortsAdapter } from "../../ports/useOsUpdatePortsAdapter";
import { resetToMyLedger } from "../../utils/myLedgerNavigation";

type Props = StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.OsUpdate>;

export default function OsUpdateFlowScreen({ route }: Props) {
  const navigation = useNavigation<BaseNavigation>();
  const ports = useOsUpdatePortsAdapter();
  const { device: routeDevice, mode } = route.params;
  const device = useMemo(() => toOsUpdateDevice(routeDevice), [routeDevice]);

  const onClose = useCallback(() => navigation.goBack(), [navigation]);
  const onReconnect = useCallback(
    (reconnectDevice: OsUpdateDevice | undefined) =>
      resetToMyLedger(navigation, {
        device: reconnectDevice ? toMyLedgerDevice(reconnectDevice) : undefined,
      }),
    [navigation],
  );

  useEffect(() => {
    if (!ports) onReconnect(device);
  }, [ports, onReconnect, device]);

  if (!ports) return null;

  return (
    <OsUpdatePortsProvider ports={ports}>
      <OsUpdateFlow device={device} mode={mode} onClose={onClose} onReconnect={onReconnect} />
    </OsUpdatePortsProvider>
  );
}
