import React from "react";
import { OsUpdatePortsProvider } from "@features/flow-device-os-update";
import { OsUpdateFlow } from "@features/flow-device-os-update/native";
import type { SyncOnboardingStackParamList } from "~/components/RootNavigator/types/SyncOnboardingNavigator";
import type { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import type { ScreenName } from "~/const";
import { useOnboardingOsUpdateViewModel } from "./useOnboardingOsUpdateViewModel";

type Props = StackNavigatorProps<SyncOnboardingStackParamList, ScreenName.SyncOnboardingOsUpdate>;

/** The OS update flow, opened by the early security check of a device that is not onboarded yet. */
export default function OnboardingOsUpdateScreen(props: Props) {
  const { ports, device, onClose, onReconnect } = useOnboardingOsUpdateViewModel(props);

  if (!ports) return null;

  return (
    <OsUpdatePortsProvider ports={ports}>
      <OsUpdateFlow device={device} onClose={onClose} onReconnect={onReconnect} />
    </OsUpdatePortsProvider>
  );
}
