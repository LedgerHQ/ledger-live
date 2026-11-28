import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { OsUpdateFlowMode } from "@features/flow-device-os-update";
import { BootloaderDiscovered as BootloaderDiscoveredBlock } from "@features/flow-device-os-update/native";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { toDmkDevice } from "../../ports/osUpdateDevice";

export function BootloaderDiscovered({ device }: Readonly<{ device: Device }>) {
  const navigation = useNavigation<BaseNavigation>();
  const onContinue = useCallback(
    () =>
      navigation.navigate(ScreenName.OsUpdate, {
        device: toDmkDevice(device),
        mode: OsUpdateFlowMode.BOOTLOADER_REPAIR,
      }),
    [navigation, device],
  );

  return (
    <BootloaderDiscoveredBlock
      analyticsModelId={device.modelId}
      wired={device.wired}
      onContinue={onContinue}
    />
  );
}
