import { useCallback, useEffect, useMemo, useState } from "react";
import { BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { selectHasOsUpdates } from "@domain/entity-device-os-update";
import type { SyncOnboardingStackParamList } from "~/components/RootNavigator/types/SyncOnboardingNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ScreenName } from "~/const";
import { useStore } from "~/context/hooks";
import { toDmkDevice, toOsUpdateDevice } from "../../ports/osUpdateDevice";
import { useOsUpdatePortsAdapter } from "../../ports/useOsUpdatePortsAdapter";

type Props = StackNavigatorProps<SyncOnboardingStackParamList, ScreenName.SyncOnboardingOsUpdate>;

export function useOnboardingOsUpdateViewModel({ route }: Props) {
  const { device: routeDevice, onBackFromUpdate } = route.params;
  const store = useStore();
  const ports = useOsUpdatePortsAdapter();
  const device = useMemo(() => toOsUpdateDevice(toDmkDevice(routeDevice)), [routeDevice]);

  const [hadOsUpdates] = useState(() => selectHasOsUpdates(store.getState()));

  const onClose = useCallback(() => onBackFromUpdate("start"), [onBackFromUpdate]);
  // The flow clears the resolved OS updates once the update completed.
  const onReconnect = useCallback(() => {
    const isCompleted = hadOsUpdates && !selectHasOsUpdates(store.getState());
    onBackFromUpdate(isCompleted ? "completed" : "start");
  }, [onBackFromUpdate, store, hadOsUpdates]);

  // The flow registers its own handler once the update starts, which then takes precedence.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
        onClose();
        return true;
      });
      return () => subscription.remove();
    }, [onClose]),
  );

  useEffect(() => {
    if (!ports) onClose();
  }, [ports, onClose]);

  return { ports, device, onClose, onReconnect };
}
