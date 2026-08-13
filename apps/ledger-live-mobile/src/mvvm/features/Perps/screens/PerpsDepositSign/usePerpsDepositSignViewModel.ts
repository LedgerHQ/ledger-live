import { useCallback, useEffect, useRef, useState } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { SetHeaderOptionsRequest } from "~/components/SelectDevice2";
import type { RootComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { ScreenName } from "~/const";
import {
  usePerpsDepositExecution,
  type PerpsDepositDeviceStep,
  type PerpsDepositSignedResult,
} from "../../hooks/usePerpsDepositExecution";

type NavigationProps = RootComposite<
  StackNavigatorProps<BaseNavigatorStackParamList, ScreenName.PerpsDepositSign>
>;

export type PerpsDepositSignViewModel = Readonly<{
  selectedDevice: Device | null | undefined;
  deviceStep: PerpsDepositDeviceStep;
  setSelectedDevice: (device: Device | null | undefined) => void;
  retry: () => void;
  requestToSetHeaderOptions: (req: SetHeaderOptionsRequest) => void;
}>;

export function usePerpsDepositSignViewModel({
  navigation,
  route,
}: NavigationProps): PerpsDepositSignViewModel {
  const [selectedDevice, setSelectedDevice] = useState<Device | null | undefined>();

  const handleSigned = useCallback(
    (_result: PerpsDepositSignedResult) => {
      // The deposit lands asynchronously through the provider; there is no
      // mobile confirmation screen yet, so return to the perps app.
      navigation.goBack();
    },
    [navigation],
  );

  const { deviceStep, executeDeposit, retry } = usePerpsDepositExecution(
    route.params,
    handleSigned,
  );

  const startedRef = useRef(false);
  useEffect(() => {
    if (!selectedDevice || startedRef.current) return;
    startedRef.current = true;
    void executeDeposit();
  }, [executeDeposit, selectedDevice]);

  const requestToSetHeaderOptions = useCallback(
    (req: SetHeaderOptionsRequest) => {
      if (req.type === "set") {
        navigation.setOptions({
          headerShown: true,
          headerLeft: req.options.headerLeft,
          headerRight: req.options.headerRight,
        });
      } else {
        navigation.setOptions({
          headerShown: false,
          headerLeft: () => null,
          headerRight: () => null,
        });
      }
    },
    [navigation],
  );

  return {
    selectedDevice,
    deviceStep,
    setSelectedDevice,
    retry,
    requestToSetHeaderOptions,
  };
}
